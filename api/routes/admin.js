import express from 'express';
import { body } from 'express-validator';
import User from '../models/D1User.js';
import auth from '../middleware/auth.js';
import { handleValidationErrors, checkUserExists } from '../middleware/validation.js';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get all user list (admin only)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Get all users and filter by search term
    const allUsers = await User.findAll();
    
    // Filter users by search term
    let filteredUsers = allUsers;
    if (search) {
      filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort by creation date (descending) and paginate
    const sortedUsers = filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedUsers = sortedUsers.slice(skip, skip + parseInt(limit));
    
    // Remove sensitive fields
    const users = paginatedUsers.map(user => {
      const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
      return safeUser;
    });

    const totalUsers = filteredUsers.length;

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get single user details (admin only)
router.get('/users/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive fields
    const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

    res.json({ user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Admin adds credits for user
router.post('/users/:userId/credits/add', auth, requireAdmin, [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
], handleValidationErrors, checkUserExists, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = req.targetUser;

    // Update user credits
    user.credits += amount;
    await user.save();

    // Record operation log (can be extended to record in database)
    console.log(`Admin ${req.user.userId} added ${amount} credits to user ${user._id}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      message: 'Credits added successfully',
      credits: user.credits,
      operation: {
        type: 'add',
        amount,
        adminId: req.user.userId,
        reason,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ message: 'Error adding credits' });
  }
});

// Admin deducts user credits
router.post('/users/:userId/credits/deduct', auth, requireAdmin, [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
], handleValidationErrors, checkUserExists, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = req.targetUser;

    // Check if credits are sufficient
    if (user.credits < amount) {
      return res.status(400).json({ 
        message: 'Insufficient credits', 
        currentCredits: user.credits 
      });
    }

    // Update user credits
    user.credits -= amount;
    await user.save();

    // Record operation log
    console.log(`Admin ${req.user.userId} deducted ${amount} credits from user ${user._id}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      message: 'Credits deducted successfully',
      credits: user.credits,
      operation: {
        type: 'deduct',
        amount,
        adminId: req.user.userId,
        reason,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({ message: 'Error deducting credits' });
  }
});

// Set user credits (direct setting)
router.put('/users/:userId/credits/set', auth, requireAdmin, [
  body('amount').isInt({ min: 0 }).withMessage('Amount must be a non-negative integer'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
], handleValidationErrors, checkUserExists, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = req.targetUser;

    // Directly set credits
    const oldCredits = user.credits;
    user.credits = amount;
    await user.save();

    // Record operation log
    console.log(`Admin ${req.user.userId} set credits from ${oldCredits} to ${amount} for user ${user._id}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      message: 'Credits set successfully',
      credits: user.credits,
      previousCredits: oldCredits,
      operation: {
        type: 'set',
        amount,
        previousAmount: oldCredits,
        adminId: req.user.userId,
        reason,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Set credits error:', error);
    res.status(500).json({ message: 'Error setting credits' });
  }
});

// Get credit operation history (simplified version, should be stored in database in actual project)
router.get('/credits/history', auth, requireAdmin, async (req, res) => {
  try {
    // Return empty array here, actual project should get operation history from database
    res.json({
      operations: [],
      message: 'Credit operation history will be implemented in future versions'
    });
  } catch (error) {
    console.error('Get credit history error:', error);
    res.status(500).json({ message: 'Error fetching credit history' });
  }
});

export default router;