import express from 'express';
import { body } from 'express-validator';
import auth from '../middleware/auth.js';
import User from '../models/D1User.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, async (req, res) => {
  try {

    const { name, email } = req.body;
    
    // Check if user exists
    const existingUser = await User.findById(req.user.userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const userWithEmail = await User.findByEmail(email);
      if (userWithEmail && userWithEmail.id !== req.user.userId) {
        return res.status(400).json({ 
          message: 'Email is already taken by another user' 
        });
      }
      updateData.email = email;
    }

    // Update user using D1 model
    const user = await User.update(req.user.userId, updateData);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Update user avatar
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    const user = await User.update(req.user.userId, { avatar: avatarUrl });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

// Change password
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password using D1 model
    await User.update(req.user.userId, { password: newPassword });

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Delete user account
router.delete('/account', auth, async (req, res) => {
  try {
    const user = await User.delete(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
});

export default router;