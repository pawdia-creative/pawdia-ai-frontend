import express from 'express';
import { body } from 'express-validator';
import auth from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import PaymentService from '../services/paymentService.js';

const router = express.Router();

// Create order
router.post('/create-order', [
  body('items').isArray().notEmpty(),
  body('totalAmount').isNumeric().isFloat({ min: 0.01 }),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
], handleValidationErrors, async (req, res) => {
  try {
    const { items, totalAmount, currency, userId } = req.body;

    // Validate required fields
    if (!items || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields: items and totalAmount are required' });
    }

    // Create PayPal order
    const order = await PaymentService.createPayPalOrder({
      items,
      totalAmount,
      currency,
      userId
    });
    
    // Save order in database
    await PaymentService.createOrderRecord({
      items,
      totalAmount,
      currency,
      userId
    }, order.id);

    res.status(200).json({
      orderId: order.id,
      approvalUrl: order.links.find(link => link.rel === 'approve').href
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create PayPal order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Capture payment
router.post('/capture-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Capture PayPal order
    const capture = await PaymentService.capturePayPalOrder(orderId);

    // Update order status in database
    await PaymentService.completeOrder(orderId, capture.id, capture);

    res.status(200).json({
      message: 'Payment captured successfully',
      captureId: capture.id,
      status: capture.status
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ 
      message: 'Failed to capture payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get order details
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get PayPal order details
    const order = await PaymentService.getOrderDetails(orderId);

    res.status(200).json({
      order: order
    });

  } catch (error) {
    console.error('PayPal get order error:', error);
    res.status(500).json({ 
      message: 'Failed to get order details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user order history
router.get('/user-orders', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all user orders
    const orders = await PaymentService.getUserOrders(userId);

    res.status(200).json({
      orders: orders
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ 
      message: 'Failed to get user orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;