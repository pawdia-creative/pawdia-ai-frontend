import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import User from '../models/D1User.js';
import { verifyToken } from '../middleware/auth.js';
import { createWorkersRouter } from '../workers-adapter.js';

console.log('Admin routes module loading...');

// Create router
console.log('Creating admin router...');
const router = createWorkersRouter();
console.log('Admin router created:', router);

// Admin authentication middleware for Cloudflare Workers
async function requireAdmin(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization token required' 
      });
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    const JWT_SECRET = globalThis.env?.JWT_SECRET || process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ 
        message: 'Server configuration error: JWT_SECRET not set' 
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    return { user: decoded };
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ 
      message: 'Authentication error' 
    });
  }
}

// Specific test route
router.get('/test', async (req, res) => {
  console.log('Admin test route called!', {
    url: req.url,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query
  });
  return res.json({ 
    message: 'Admin routes working!',
    url: req.url,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query
  });
});

// Get all user list (admin only)
router.get('/users', async (req, res) => {
  console.log('Admin users route called!', {
    method: req.method,
    path: req.path,
    url: req.url,
    params: req.params,
    query: req.query
  });
  
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { page = 1, limit = 20, search = '' } = req.query;
      const skip = (page - 1) * limit;
      
      // Get all users from database
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

      return res.json({
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page * limit < totalUsers,
          hasPrevPage: page > 1
        }
      });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get single user details (admin only)
router.get('/users/:userId', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const userId = req.params.userId;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive fields
      const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

      return res.json({ user: safeUser });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      message: 'Error fetching user',
      error: error.message 
    });
  }
});

// Admin adds credits for user
router.post('/users/:userId/credits/add', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { amount, reason } = req.body;
      const userId = req.params.userId;

      // Basic validation
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive integer' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user credits
      user.credits = (user.credits || 0) + amount;
      await user.save();

      // Record operation log
      console.log(`Admin ${authResult.user.email} added ${amount} credits to user ${userId}. Reason: ${reason || 'No reason provided'}`);

      return res.json({
        message: 'Credits added successfully',
        credits: user.credits,
        operation: {
          type: 'add',
          amount,
          adminEmail: authResult.user.email,
          reason,
          timestamp: new Date()
        }
      });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Add credits error:', error);
    return res.status(500).json({ 
      message: 'Error adding credits',
      error: error.message 
    });
  }
});

// Admin removes credits from user
router.post('/users/:userId/credits/remove', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { amount, reason } = req.body;
      const userId = req.params.userId;

      // Basic validation
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive integer' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has enough credits
      const currentCredits = user.credits || 0;
      if (currentCredits < amount) {
        return res.status(400).json({ 
          message: 'Insufficient credits',
          currentCredits,
          requestedAmount: amount
        });
      }

      // Update user credits
      user.credits = currentCredits - amount;
      await user.save();

      // Record operation log
      console.log(`Admin ${authResult.user.email} removed ${amount} credits from user ${userId}. Reason: ${reason || 'No reason provided'}`);

      return res.json({
        message: 'Credits removed successfully',
        credits: user.credits,
        operation: {
          type: 'remove',
          amount,
          adminEmail: authResult.user.email,
          reason,
          timestamp: new Date()
        }
      });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Remove credits error:', error);
    return res.status(500).json({ 
      message: 'Error removing credits',
      error: error.message 
    });
  }
});

// Set user credits (direct setting)
router.put('/users/:userId/credits/set', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { amount, reason } = req.body;
      const userId = req.params.userId;

      // Basic validation
      if (amount === undefined || amount < 0) {
        return res.status(400).json({ message: 'Amount must be a non-negative integer' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Directly set credits
      const oldCredits = user.credits || 0;
      user.credits = amount;
      await user.save();

      // Record operation log
      console.log(`Admin ${authResult.user.email} set credits from ${oldCredits} to ${amount} for user ${userId}. Reason: ${reason || 'No reason provided'}`);

      return res.json({
        message: 'Credits set successfully',
        credits: user.credits,
        previousCredits: oldCredits,
        operation: {
          type: 'set',
          amount,
          previousAmount: oldCredits,
          adminEmail: authResult.user.email,
          reason,
          timestamp: new Date()
        }
      });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Set credits error:', error);
    return res.status(500).json({ 
      message: 'Error setting credits',
      error: error.message 
    });
  }
});

// Get credit operation history
router.get('/credits/history', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      // Return empty array here, actual project should get operation history from database
      return res.json({
        operations: [],
        message: 'Credit operation history will be implemented in future versions'
      });
    }
    // If auth fails, requireAdmin already sent the response

  } catch (error) {
    console.error('Get credit history error:', error);
    return res.status(500).json({ 
      message: 'Error fetching credit history',
      error: error.message 
    });
  }
});

export default router;