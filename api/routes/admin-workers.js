import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/D1User.js';
import Analytics from '../models/D1Analytics.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { verifyToken } from '../middleware/auth.js';
import { createWorkersRouter } from '../workers-adapter.js';
import d1Database from '../config/d1-database.js';

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
      
      // Filter out users with null or invalid IDs
      const validUsers = filteredUsers.filter(user => user.id != null && user.id !== 'null' && user.id !== '');
      
      // Sort by creation date (descending) and paginate
      const sortedUsers = validUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const paginatedUsers = sortedUsers.slice(skip, skip + parseInt(limit));
      
      // Remove sensitive fields
      const users = paginatedUsers.map(user => {
        const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
        return safeUser;
      });

      const totalUsers = validUsers.length;

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

// Admin resend verification email to a specific user (admin only)
router.post('/users/:userId/resend-verification', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'User has already verified their email' });
      }

      // Generate a fresh verification token and save
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      await user.save();

      // Send verification email (emailService will create short link mapping)
      try {
        const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);
        return res.json({
          message: 'Verification email resent',
          emailSent: !!emailSent
        });
      } catch (emailErr) {
        console.error('[ADMIN RESEND] sendVerificationEmail error:', emailErr);
        return res.status(500).json({ message: 'Failed to send verification email', error: emailErr.message });
      }
    }
  } catch (error) {
    console.error('[ADMIN RESEND] Error:', error);
    return res.status(500).json({ message: 'Error resending verification email', error: error.message });
  }
});

// Admin force-send verification email (even if user already verified)
router.post('/users/:userId/force-send-verification', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate a fresh verification token and save it (do not change isVerified)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      await user.save();

      // Create short id and store mapping in D1
      let shortId = null;
      try {
        shortId = Math.random().toString(36).substring(2, 10);
        const db = await d1Database.connect(globalThis.env);
        if (db) {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS short_links (
              id TEXT PRIMARY KEY,
              token TEXT,
              created_at INTEGER,
              expires_at INTEGER
            )
          `).run();
          const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
          await db.prepare(`
            INSERT OR REPLACE INTO short_links (id, token, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)
          `).bind(shortId, verificationToken, Date.now(), expiresAt).run();
        } else {
          shortId = null;
        }
      } catch (err) {
        console.error('[ADMIN FORCE SEND] Short link creation failed:', err);
        shortId = null;
      }

      const apiBase = globalThis.env?.API_WORKER_URL || globalThis.env?.API_URL || process.env.API_WORKER_URL || process.env.API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev';
      const shortUrl = shortId ? `${apiBase}/api/auth/v/${shortId}` : null;

      // Send verification email (use email service)
      try {
        const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);
        return res.json({
          message: 'Verification email force-sent',
          emailSent: !!emailSent,
          shortUrl
        });
      } catch (emailErr) {
        console.error('[ADMIN FORCE SEND] sendVerificationEmail error:', emailErr);
        return res.status(500).json({ message: 'Failed to send verification email', error: emailErr.message, shortUrl });
      }
    }
  } catch (error) {
    console.error('[ADMIN FORCE SEND] Error:', error);
    return res.status(500).json({ message: 'Error force-sending verification email', error: error.message });
  }
});

// Admin generate a short verification link for a specific user and return it (does not send email)
router.post('/users/:userId/generate-shortlink', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (!authResult.user) return;

    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User has already verified their email' });
    }

    // Generate new verification token and save to user
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Create short id and store mapping in D1
    let shortId = null;
    try {
      shortId = Math.random().toString(36).substring(2, 10);
      const db = await d1Database.connect(globalThis.env);
      if (db) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS short_links (
            id TEXT PRIMARY KEY,
            token TEXT,
            created_at INTEGER,
            expires_at INTEGER
          )
        `).run();
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await db.prepare(`
          INSERT OR REPLACE INTO short_links (id, token, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)
        `).bind(shortId, verificationToken, Date.now(), expiresAt).run();
      } else {
        shortId = null;
      }
    } catch (err) {
      console.error('[ADMIN SHORTLINK] DB error:', err);
      shortId = null;
    }

    // Prefer API worker base for short links so email clients render server-side pages reliably
    const apiBase = globalThis.env?.API_WORKER_URL || globalThis.env?.API_URL || process.env.API_WORKER_URL || process.env.API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev';
    const shortUrl = shortId ? `${apiBase}/api/auth/v/${shortId}` : null;

    return res.json({
      message: 'Short verification link generated',
      shortUrl
    });
  } catch (error) {
    console.error('[ADMIN SHORTLINK] Error:', error);
    return res.status(500).json({ message: 'Error generating short link', error: error.message });
  }
});

// Admin adds credits for user
router.post('/users/:userId/credits/add', async (req, res) => {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { amount } = req.body;
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
      console.log(`Admin ${authResult.user.email} added ${amount} credits to user ${userId}`);

      return res.json({
        message: 'Credits added successfully',
        credits: user.credits,
        operation: {
          type: 'add',
          amount,
          adminEmail: authResult.user.email,
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
      const { amount } = req.body;
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
      console.log(`Admin ${authResult.user.email} removed ${amount} credits from user ${userId}`);

      return res.json({
        message: 'Credits removed successfully',
        credits: user.credits,
        operation: {
          type: 'remove',
          amount,
          adminEmail: authResult.user.email,
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
      const { amount } = req.body;
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
      console.log(`Admin ${authResult.user.email} set credits from ${oldCredits} to ${amount} for user ${userId}`);

      return res.json({
        message: 'Credits set successfully',
        credits: user.credits,
        previousCredits: oldCredits,
        operation: {
          type: 'set',
          amount,
          previousAmount: oldCredits,
          adminEmail: authResult.user.email,
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

// Admin update subscription plan/status/expiresAt and optionally adjust credits
router.put('/users/:userId/subscription', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { plan, status, expiresAt, setCredits, addPlanCredits } = req.body;
      const userId = req.params.userId;

      const allowedPlans = ['free', 'basic', 'premium', null, undefined];
      const allowedStatus = ['active', 'inactive', 'expired', null, undefined];
      const planCredits = { free: 3, basic: 30, premium: 60 };

      if (!allowedPlans.includes(plan) && plan !== undefined) {
        return res.status(400).json({ message: 'Invalid plan' });
      }
      if (!allowedStatus.includes(status) && status !== undefined) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update subscription fields
      if (plan !== undefined) {
        user.subscription.plan = plan;
      }
      if (status !== undefined) {
        user.subscription.status = status;
      }
      if (expiresAt !== undefined) {
        // 支持 "PERMANENT" 作为永久标记
        if (expiresAt === 'PERMANENT') {
          user.subscription.expiresAt = null;
        } else if (expiresAt === '') {
          user.subscription.expiresAt = null;
        } else {
          user.subscription.expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
        }
      }

      // Adjust credits if requested
      if (typeof setCredits === 'number' && setCredits >= 0) {
        user.credits = setCredits;
      } else if (addPlanCredits && plan && planCredits[plan]) {
        user.credits = (user.credits || 0) + planCredits[plan];
      }

      await user.save();

      const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

      return res.json({
        message: 'Subscription updated successfully',
        user: safeUser
      });
    }
  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({
      message: 'Error updating subscription',
      error: error.message
    });
  }
});

// Admin delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const userId = req.params.userId;

      // Validate userId
      if (!userId || userId === 'null' || userId === 'undefined' || userId === '') {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Prevent deleting yourself
      if (userId === authResult.user.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deleting other admins
      if (user.isAdmin) {
        return res.status(403).json({ message: 'Cannot delete admin accounts' });
      }

      await User.findByIdAndDelete(userId);

      console.log(`Admin ${authResult.user.email} deleted user ${userId} (${user.email})`);

      return res.json({
        message: 'User deleted successfully'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Admin reset user password
router.post('/users/:userId/reset-password', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { newPassword } = req.body;
      const userId = req.params.userId;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();

      return res.json({ message: 'Password reset successfully' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      message: 'Error resetting password',
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

// Get analytics statistics
router.get('/analytics/stats', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const { startDate, endDate, userId, eventType } = req.query;
      
      // Initialize analytics table if needed (must succeed)
      try {
        await Analytics.initTable();
        console.log('✅ Analytics table initialized successfully');
      } catch (initError) {
        console.error('❌ Analytics table init error:', initError);
        // If table doesn't exist, we need to create it
        // Return empty stats if table creation fails
        if (initError.message && initError.message.includes('no such table')) {
          // Try to create the table again
          try {
            await Analytics.initTable();
            console.log('✅ Analytics table created on retry');
          } catch (retryError) {
            console.error('❌ Analytics table creation failed on retry:', retryError);
            // Return empty stats instead of error
            return res.json({
              totalPageViews: 0,
              totalApiCalls: 0,
              uniqueUsers: 0,
              uniqueSessions: 0,
              apiByEndpoint: [],
              apiByStatus: [],
              hourlyStats: [],
              topUsers: []
            });
          }
        } else {
          // For other errors, still try to proceed
          console.log('⚠️ Analytics table init warning:', initError.message);
        }
      }
      
      const stats = await Analytics.getStatistics({
        startDate,
        endDate,
        userId,
        eventType
      });
      
      return res.json(stats);
    }
  } catch (error) {
    console.error('Get analytics stats error:', error);
    // If table doesn't exist, return empty stats instead of error
    if (error.message && error.message.includes('no such table')) {
      return res.json({
        totalPageViews: 0,
        totalApiCalls: 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        apiByEndpoint: [],
        apiByStatus: [],
        hourlyStats: [],
        topUsers: []
      });
    }
    return res.status(500).json({
      message: 'Error fetching analytics statistics',
      error: error.message
    });
  }
});

// Get recent analytics events
router.get('/analytics/events', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const limit = parseInt(req.query.limit) || 50;
      
      // Initialize analytics table if needed
      try {
        await Analytics.initTable();
      } catch (initError) {
        console.log('Analytics table init:', initError.message);
      }
      
      const events = await Analytics.getRecentEvents(limit);
      
      return res.json({ events });
    }
  } catch (error) {
    console.error('Get analytics events error:', error);
    return res.status(500).json({
      message: 'Error fetching analytics events',
      error: error.message 
    });
  }
});

// Admin: list short links and associated users
router.get('/shortlinks', async (req, res) => {
  try {
    const authResult = await requireAdmin(req, res);
    if (authResult.user) {
      const db = await d1Database.connect(globalThis.env);
      if (!db) {
        return res.status(500).json({ message: 'Database not available' });
      }

      // Ensure table exists
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS short_links (
            id TEXT PRIMARY KEY,
            token TEXT,
            created_at INTEGER,
            expires_at INTEGER
          )
        `).run();
      } catch (e) {
        // ignore if exists
      }

      const stmt = db.prepare('SELECT id, token, created_at, expires_at FROM short_links ORDER BY created_at DESC');
      const rows = await stmt.all();
      const results = [];
      for (const r of rows.results || []) {
        // Try to find user by token
        const userStmt = db.prepare('SELECT id, email, is_verified FROM users WHERE verification_token = ?1');
        const userRow = await userStmt.bind(r.token).first();
        results.push({
          shortId: r.id,
          tokenExists: !!r.token,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
          user: userRow ? { id: userRow.id, email: userRow.email, isVerified: !!userRow.is_verified } : null
        });
      }

      return res.json({ shortLinks: results });
    }
  } catch (error) {
    console.error('[ADMIN SHORTLINKS] Error listing short links:', error);
    return res.status(500).json({ message: 'Error listing short links', error: error.message });
  }
});

export default router;