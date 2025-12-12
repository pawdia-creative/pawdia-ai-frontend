import { toast } from 'sonner';

interface OrderData {
  items: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  currency: string;
  userId?: string;
  type?: string;
  credits?: number;
  plan?: string;
}

interface PaymentResult {
  orderId: string;
  captureId?: string;
  status: string;
}

class PaymentService {
  private static baseUrl = `${import.meta.env.VITE_API_URL || window.location.origin}/api/payments`;

  /**
   * Create PayPal order
   */
  static async createOrder(orderData: OrderData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error('Failed to create payment order');
      throw error;
    }
  }

  /**
   * Capture PayPal payment
   */
  static async capturePayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/capture-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to capture payment');
      }

      const result = await response.json();
      return {
        orderId,
        captureId: result.captureId,
        status: result.status
      };
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast.error('Payment capture failed');
      throw error;
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to get order details');
      }

      const data = await response.json();
      return data.order;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  /**
   * Get user order history
   */
  static async getUserOrders(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user orders');
      }

      const data = await response.json();
      return data.orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Handle payment success logic
   */
  static handlePaymentSuccess(
    orderId: string, 
    captureId: string, 
    totalAmount: number,
    onSuccess?: () => void
  );
  static handlePaymentSuccess(message: string);
  static handlePaymentSuccess(
    arg1: string, 
    arg2?: string, 
    arg3?: number,
    arg4?: () => void
  ) {
    if (typeof arg2 === 'string') {
      // This is the full version: handlePaymentSuccess(orderId, captureId, totalAmount, onSuccess)
      const onSuccess = arg4;
      // Can add common logic after payment success here
      // For example, send analytics events, update user status, etc.
      
      if (onSuccess) {
        onSuccess();
      }
    } else {
      // This is the simplified version: handlePaymentSuccess(message)
      toast.success(arg1);
    }
  }

  /**
   * Handle payment cancellation
   */
  static handlePaymentCancel() {
    toast.info('Payment was cancelled');
  }

  /**
   * Handle payment errors
   */
  static handlePaymentError(error: any) {
    console.error('PayPal error:', error);
    toast.error('An error occurred during payment');
  }
}

export default PaymentService;