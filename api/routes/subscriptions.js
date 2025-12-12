import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import CreditService from '../services/creditService.js';

const router = express.Router();

// Get user credits and subscription information
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      credits: user.credits,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Get subscription profile error:', error);
    res.status(500).json({ message: 'Error fetching subscription profile' });
  }
});

// Add credits
router.post('/credits/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const newCredits = await CreditService.addCredits(req.user.userId, amount, 'User recharge');

    res.json({ 
      message: 'Credits added successfully', 
      credits: newCredits 
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use credits (for AI portrait generation)
router.post('/credits/use', auth, async (req, res) => {
  try {
    const { amount = 1 } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const newCredits = await CreditService.deductCredits(req.user.userId, amount, 'AI portrait generation');

    res.json({
      message: 'Credits used successfully',
      credits: newCredits
    });
  } catch (error) {
    console.error('Use credits error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Subscription plans
const subscriptionPlans = {
  free: {
    name: 'Free',
    price: 0,
    credits: 3,
    features: ['3 free AI generations', 'Basic art styles']
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    credits: 20,
    features: ['20 AI generations', 'All art styles', 'Priority processing']
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    credits: 50,
    features: ['50 AI generations', 'All art styles', 'Priority processing', 'HD quality']
  }
};

// Get subscription plan information
router.get('/plans', auth, async (req, res) => {
  try {
    res.json(subscriptionPlans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
});

// Purchase subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!subscriptionPlans[plan]) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const selectedPlan = subscriptionPlans[plan];
    
    // Check if user has already subscribed to free plan (prevent duplicate credit acquisition)
    if (plan === 'free' && user.subscription && user.subscription.plan === 'free') {
      return res.status(400).json({ 
        message: 'You have already activated the free subscription. You cannot activate it again.' 
      });
    }
    
    // Check if user has already subscribed to other plans
    if (plan !== 'free' && user.subscription.status === 'active' && 
        user.subscription.expiresAt > new Date()) {
      return res.status(400).json({ 
        message: 'You already have an active subscription. Please wait until it expires before purchasing a new one.' 
      });
    }
    
    // Here should integrate payment system, temporarily simulate payment success
    // In actual application, should call payment API
    
    // Update user subscription information
    user.subscription.plan = plan;
    user.subscription.status = 'active';
    user.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Expires in 30 days
    
    // Add subscription bonus credits (only add for first free subscription)
    if (plan === 'free' && user.subscription.plan !== 'free') {
      await CreditService.addCredits(req.user.userId, selectedPlan.credits, `Free subscription bonus`);
    } else if (plan !== 'free') {
      // Paid plans add credits every time
      await CreditService.addCredits(req.user.userId, selectedPlan.credits, `${selectedPlan.name} subscription bonus`);
    }
    
    await user.save();

    res.json({
      message: 'Subscription purchased successfully',
      subscription: user.subscription,
      credits: user.credits
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Error processing subscription' });
  }
});

export default router;