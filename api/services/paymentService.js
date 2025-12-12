import Order from '../models/Order.js';
import CreditService from './creditService.js';
import fetch from 'node-fetch';

class PaymentService {
  // PayPal environment configuration
  static paypalBaseUrl = process.env.PAYPAL_MODE === 'live' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  /**
   * Get PayPal access token
   */
  static async getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${this.paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    return data.access_token;
  }

  /**
   * Create PayPal order
   */
  static async createPayPalOrder(orderData) {
    try {
      const accessToken = await this.getPayPalAccessToken();
      
      const orderResponse = await fetch(`${this.paypalBaseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: orderData.currency || 'USD',
              value: orderData.totalAmount.toString()
            },
            description: orderData.description || 'AI Pet Portrait Products',
            items: orderData.items.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity.toString(),
              unit_amount: {
                currency_code: orderData.currency || 'USD',
                value: item.price.toString()
              }
            }))
          }],
          application_context: {
            brand_name: 'Pawdia AI Portraits',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: `${process.env.CLIENT_URL}/payment/success`,
            cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
          }
        })
      });
      
      const order = await orderResponse.json();
      
      if (!order.id) {
        throw new Error('PayPal order creation failed');
      }
      
      return order;
    } catch (error) {
      throw new Error(`PayPal order creation error: ${error.message}`);
    }
  }

  /**
   * Capture PayPal payment
   */
  static async capturePayPalOrder(orderId) {
    try {
      const accessToken = await this.getPayPalAccessToken();
      
      const captureResponse = await fetch(`${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        }
      });
      
      const capture = await captureResponse.json();
      return capture;
    } catch (error) {
      throw new Error(`PayPal capture error: ${error.message}`);
    }
  }

  /**
   * Create database order record
   */
  static async createOrderRecord(orderData, paypalOrderId) {
    try {
      const dbOrder = new Order({
        paypalOrderId: paypalOrderId,
        userId: orderData.userId,
        items: orderData.items.map(item => ({
          productId: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: orderData.totalAmount,
        currency: orderData.currency || 'USD',
        status: 'PENDING'
      });

      await dbOrder.save();
      return dbOrder;
    } catch (error) {
      throw new Error(`Order record creation error: ${error.message}`);
    }
  }

  /**
   * Update order status to completed
   */
  static async completeOrder(paypalOrderId, paypalCaptureId, paymentDetails) {
    try {
      const order = await Order.findOne({ paypalOrderId: paypalOrderId });
      if (order) {
        order.status = 'COMPLETED';
        order.paypalCaptureId = paypalCaptureId;
        order.paymentDetails = paymentDetails;
        order.completedAt = new Date();
        await order.save();
      }
      return order;
    } catch (error) {
      throw new Error(`Order completion error: ${error.message}`);
    }
  }

  /**
   * Process subscription payment and award credits
   */
  static async processSubscriptionPayment(userId, plan, credits) {
    try {
      // Add subscription bonus credits
      await CreditService.addCredits(userId, credits, `${plan} subscription bonus`);
      
      return {
        success: true,
        creditsAdded: credits,
        message: 'Subscription payment processed successfully'
      };
    } catch (error) {
      throw new Error(`Subscription payment processing error: ${error.message}`);
    }
  }

  /**
   * Process credit purchase payment and award credits
   */
  static async processCreditPurchase(userId, credits) {
    try {
      // Add purchased credits
      await CreditService.addCredits(userId, credits, 'Credit purchase');
      
      return {
        success: true,
        creditsAdded: credits,
        message: 'Credit purchase processed successfully'
      };
    } catch (error) {
      throw new Error(`Credit purchase processing error: ${error.message}`);
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getPayPalAccessToken();
      
      const orderResponse = await fetch(`${this.paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const order = await orderResponse.json();
      return order;
    } catch (error) {
      throw new Error(`Get order details error: ${error.message}`);
    }
  }

  /**
   * Get user order history
   */
  static async getUserOrders(userId) {
    try {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      return orders;
    } catch (error) {
      throw new Error(`Get user orders error: ${error.message}`);
    }
  }
}

export default PaymentService;