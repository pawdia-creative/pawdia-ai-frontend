import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/D1User.js';
import auth from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/simple-validation.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { createWorkersRouter } from '../workers-adapter.js';
import d1Database from '../config/d1-database.js';

const router = createWorkersRouter();

// Note: CORS preflight (OPTIONS) is handled globally in `worker.js`.

// Get JWT_SECRET from environment variables
const getJWTSecret = () => {
  const secret = globalThis.env?.JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

// Generate JWT token
const generateToken = (user) => {
  const JWT_SECRET = getJWTSecret();
  return jwt.sign({
    userId: user.id,
    isAdmin: user.isAdmin || false,
    email: user.email
  }, JWT_SECRET, { expiresIn: '7d' });
};

// Register user
router.post('/register', validateRegister, async (req, res) => {
  try {
    console.log('[DEBUG] Register handler entry, req.body.email:', req.body?.email);
    const { email, password, name } = req.body;
    console.log('[DEBUG] After destructuring, email:', email, 'req.body.email:', req.body?.email);

    // Check if user already exists
    console.log('[DEBUG] Before findByEmail, search email:', email);
    const existingUser = await User.findByEmail(email);
    console.log('[DEBUG] After findByEmail, existingUser:', existingUser ? {id: existingUser.id, email: existingUser.email} : null, 'searchEmail:', email);

    if (existingUser) {
      // 更严格的验证：确保 existingUser 是有效的用户对象
      const isValidUser = existingUser && 
                         typeof existingUser === 'object' &&
                         existingUser.id !== undefined && 
                         existingUser.id !== null &&
                         existingUser.id !== '' &&
                         existingUser.email && 
                         typeof existingUser.email === 'string' &&
                         existingUser.email.trim().length > 0;
      
      if (!isValidUser) {
        console.error('[DEBUG] Invalid existingUser object:', JSON.stringify(existingUser));
        console.log('[DEBUG] Invalid user object detected (id:', existingUser?.id, 'email:', existingUser?.email, '), continuing with registration');
        // 继续注册流程，不阻止（可能是查询错误）
      } else {
        console.log('[DEBUG] User already exists! existingUser.email:', existingUser.email, 'searchEmail:', email);
        return res.status(400).json({ 
          message: 'User already exists',
          debug: {
            existingUserEmail: existingUser.email,
            searchEmail: email,
            emailsMatch: existingUser.email === email,
            existingUserId: existingUser.id
          }
        });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user with verification token
    const user = await User.create({
      email,
      password,
      name,
      verificationToken,
      isVerified: false
    });

    // Send verification email (non-blocking - don't fail registration if email fails)
    let emailSent = false;
    let emailError = null;
    try {
      emailSent = await sendVerificationEmail(email, name, verificationToken);
      if (!emailSent) {
        console.warn('[REGISTER] 验证邮件发送失败，但用户已创建');
      }
    } catch (err) {
      emailError = err;
      console.error('[REGISTER] Email sending error (non-blocking):', err.message);
      console.error('[REGISTER] Email error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error('[REGISTER] Email error stack:', err.stack);
      // 不抛出错误，继续注册流程
    }

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
      message: emailSent ? 'Registration successful! Please check your email to verify your account.' : 'Registration successful, but verification email failed to send. Please contact support.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Registration error stack:', error.stack);
    console.error('Registration error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause
    });
    
    // 检查是否是"用户已存在"错误，应该返回 400 而不是 500
    if (error.message === 'Email already exists' || 
        error.message.includes('Email already exists') ||
        error.message.includes('UNIQUE constraint failed')) {
      console.log('[DEBUG] Email already exists error caught, returning 400');
      return res.status(400).json({ 
        message: 'User already exists',
        error: error.message
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error',
      error: error.message, // 始终返回错误信息（用于调试）
      errorType: error.constructor?.name || 'Unknown',
      stack: globalThis.env?.ENVIRONMENT === 'development' ? error.stack : undefined
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Ensure CORS headers present for cross-origin login requests
    try {
      const origin = req.headers && req.headers.origin ? req.headers.origin : (globalThis.env?.CLIENT_URL || process.env.CLIENT_URL || '*');
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Credentials', 'true');
    } catch (corsErr) {
      console.warn('[CORS] Could not set CORS headers on login response:', corsErr);
    }
    console.log('[DEBUG] Login handler entry, req.body.email:', req.body?.email);
    const { email, password } = req.body;
    console.log('[DEBUG] After destructuring, email:', email, 'req.body.email:', req.body?.email);

    // Find user using D1 database
    console.log('[DEBUG] Before findByEmail, search email:', email);
    const user = await User.findByEmail(email);
    console.log('[DEBUG] After findByEmail, user:', user ? {id: user.id, email: user.email} : null, 'searchEmail:', email);

    if (!user) {
      console.log('[DEBUG] User not found! searchEmail:', email);
      return res.status(400).json({ 
        message: 'User does not exist',
        debug: {
          searchEmail: email,
          emailType: typeof email,
          emailLength: email?.length
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user);

    // Ensure credits is a number and subscription has a safe default
    const userCredits = (user.credits === null || user.credits === undefined) ? 0 : Number(user.credits);
    const subscription = user.subscription || {
      plan: null,
      status: 'inactive',
      expiresAt: null
    };

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        credits: userCredits,
        subscription
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    console.log('[AUTH] /me request, userId:', req.user?.userId);
    // Find user using D1 database
    const user = await User.findById(req.user.userId);

    if (!user) {
      console.log('[AUTH] /me: User not found for userId:', req.user?.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[AUTH] /me: User found, credits:', user.credits, 'type:', typeof user.credits, 'subscription:', JSON.stringify(user.subscription));
    
    // Ensure credits is a number, handle null/undefined properly
    const userCredits = (user.credits === null || user.credits === undefined) ? 0 : Number(user.credits);
    console.log('[AUTH] /me: Processed credits:', userCredits);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: userCredits,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        subscription: user.subscription || {
          plan: null,
          status: 'inactive',
          expiresAt: null
        },
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('[AUTH] Get user error:', error);
    console.error('[AUTH] Error stack:', error.stack);
    return res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    console.log('[VERIFY] Email verification request received');
    const { token } = req.query;
    console.log('[VERIFY] Token:', token ? `${token.substring(0, 10)}...` : 'missing');

    // Build friendly success HTML (idempotent)
    const clientBase = req.env?.CLIENT_URL || process.env.CLIENT_URL || '/';
    const returnUrl = `${clientBase.replace(/\/$/, '')}/verify-success`;
    const successHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Verified</title></head><body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f6f8fb;margin:0"><div style="background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(15,23,42,0.06);max-width:520px;text-align:center"><h1 style="margin:0 0 12px 0">Email Verified</h1><p style="color:#374151">Your email has been verified. You can close this page and return to the app to continue.</p><p style="margin-top:18px"><a href=\"${returnUrl}\" style=\"display:inline-block;margin-top:8px;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none\">Go to site</a></p></div></body></html>`;

    if (!token) {
      console.log('[VERIFY] No token provided - returning success HTML for idempotent UX');
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Find user by verification token
    console.log('[VERIFY] Searching for user with verificationToken...');
    const user = await User.findOne({ verificationToken: token });
    console.log('[VERIFY] User found:', user ? {id: user.id, email: user.email} : 'not found');

    if (!user) {
      console.warn('[VERIFY] User not found with verificationToken - returning success HTML for idempotent UX');
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Check if token is expired (24 hours)
    // Handle both Date objects and string dates
    let updatedAtTime;
    if (user.updatedAt instanceof Date) {
      updatedAtTime = user.updatedAt.getTime();
    } else if (typeof user.updatedAt === 'string') {
      updatedAtTime = new Date(user.updatedAt).getTime();
    } else {
      // Fallback to created_at if updatedAt is invalid
      console.warn('[VERIFY] Invalid updatedAt, using createdAt');
      if (user.createdAt instanceof Date) {
        updatedAtTime = user.createdAt.getTime();
      } else if (typeof user.createdAt === 'string') {
        updatedAtTime = new Date(user.createdAt).getTime();
      } else {
        updatedAtTime = Date.now(); // Default to now if both are invalid
      }
    }
    
    const tokenAge = Date.now() - updatedAtTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    console.log('[VERIFY] Token age:', tokenAge, 'ms, max age:', maxAge, 'ms');

    if (tokenAge > maxAge) {
      console.log('[VERIFY] Token expired');
      return res.status(400).json({ message: 'Verification link has expired. Please request a new verification email.' });
    }

    // Update user verification status
    console.log('[VERIFY] Updating user verification status...');
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    console.log('[VERIFY] User verification status updated successfully');

    // Return friendly HTML success page instead of JSON to make verification link idempotent
    return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (error) {
    console.error('[VERIFY] Email verification error:', error);
    console.error('[VERIFY] Error message:', error.message);
    console.error('[VERIFY] Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'An error occurred during email verification',
      error: error.message,
      errorType: error.constructor?.name || 'Unknown'
    });
  }
});

// Verify email (path-based token) - some email clients strip query strings, support /verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    console.log('[VERIFY PATH] Email verification (path) request received');
    const token = req.params && req.params.token ? req.params.token : null;
    console.log('[VERIFY PATH] Token:', token ? `${token.substring(0, 10)}...` : 'missing');

    const clientBase = req.env?.CLIENT_URL || process.env.CLIENT_URL || '/';
    const returnUrl = `${clientBase.replace(/\/$/, '')}/verify-success`;
    const successHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Verified</title></head><body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f6f8fb;margin:0"><div style="background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(15,23,42,0.06);max-width:520px;text-align:center"><h1 style="margin:0 0 12px 0">Email Verified</h1><p style="color:#374151">Your email has been verified. You can close this page and return to the app to continue.</p><p style="margin-top:18px"><a href=\"${returnUrl}\" style=\"display:inline-block;margin-top:8px;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none\">Go to site</a></p></div></body></html>`;

    if (!token) {
      console.log('[VERIFY PATH] No token provided in path - returning success HTML for idempotent UX');
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Find user by verification token
    console.log('[VERIFY PATH] Searching for user with verificationToken...');
    const user = await User.findOne({ verificationToken: token });
    console.log('[VERIFY PATH] User found:', user ? {id: user.id, email: user.email} : 'not found');

    if (!user) {
      console.warn('[VERIFY PATH] User not found with verificationToken - returning success HTML for idempotent UX');
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Check token age (24 hours)
    let updatedAtTime;
    if (user.updatedAt instanceof Date) {
      updatedAtTime = user.updatedAt.getTime();
    } else if (typeof user.updatedAt === 'string') {
      updatedAtTime = new Date(user.updatedAt).getTime();
    } else {
      if (user.createdAt instanceof Date) {
        updatedAtTime = user.createdAt.getTime();
      } else if (typeof user.createdAt === 'string') {
        updatedAtTime = new Date(user.createdAt).getTime();
      } else {
        updatedAtTime = Date.now();
      }
    }

    const tokenAge = Date.now() - updatedAtTime;
    const maxAge = 24 * 60 * 60 * 1000;
    if (tokenAge > maxAge) {
      console.log('[VERIFY PATH] Token expired');
      return res.status(400).json({ message: 'Verification link has expired. Please request a new verification email.' });
    }

    // Update user verification status
    console.log('[VERIFY PATH] Updating user verification status...');
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    console.log('[VERIFY PATH] User verification status updated successfully');

    // Return friendly HTML success page instead of JSON to make verification link idempotent
    return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('[VERIFY PATH] Email verification error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during email verification',
      error: error.message
    });
  }
});

// Short link verify route previously defined here was removed to avoid duplicate handlers.
// The consolidated handler `router.all('/v/:short')` below now processes short links idempotently.

// Short link redirect/verify: /v/:short
// Accept all methods (GET/HEAD/etc.) so HEAD requests do not return 404 in some clients
router.all('/v/:short', async (req, res) => {
  try {
    const short = req.params && req.params.short ? req.params.short : null;
    console.log('[VERIFY SHORT] Short link request received:', short);
    if (!short) {
      return res.status(400).json({ message: 'Short verification token is required' });
    }

    // Lookup mapping in D1
    let token = null;
    try {
      if (globalThis.env && globalThis.env.DB) {
        const db = await d1Database.connect(globalThis.env);
        const conn = d1Database.getDB();
        const stmt = conn.prepare('SELECT token FROM short_links WHERE id = ?1');
        const row = await stmt.bind(short).first();
        if (row && row.token) {
          token = row.token;
          console.log('[VERIFY SHORT] Found token for short:', short);
        } else {
          console.log('[VERIFY SHORT] No mapping found for short:', short);
        }
      } else {
        console.warn('[VERIFY SHORT] No DB binding available to lookup short link');
      }
    } catch (dbErr) {
      console.error('[VERIFY SHORT] DB lookup error:', dbErr);
    }

    // Build success HTML early so we can return a friendly page even if token/user missing
    const clientBase = globalThis.env?.CLIENT_URL || process.env.CLIENT_URL || '/';
    const returnUrl = `${clientBase.replace(/\/$/, '')}/verify-success`;
    const successHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Verified</title></head><body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f6f8fb;margin:0"><div style="background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(15,23,42,0.06);max-width:520px;text-align:center"><h1 style="margin:0 0 12px 0">Email Verified</h1><p style="color:#374151">Your email has been verified. You can close this page and return to the app to continue.</p><p style="margin-top:18px"><a href=\"${returnUrl}\" style=\"display:inline-block;margin-top:8px;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none\">Go to site</a></p></div></body></html>`;

    if (!token) {
      // Friendly response for missing/expired short links to improve mail client behavior
      console.warn('[VERIFY SHORT] Short id not found or expired (returning success page for UX):', short);
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Reuse existing verification logic: find user by token and verify
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      // If user not found for token, still show friendly success page
      console.warn('[VERIFY SHORT] User not found for token (returning success page for UX):', short);
      return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Check token age
    let updatedAtTime;
    if (user.updatedAt instanceof Date) {
      updatedAtTime = user.updatedAt.getTime();
    } else if (typeof user.updatedAt === 'string') {
      updatedAtTime = new Date(user.updatedAt).getTime();
    } else {
      updatedAtTime = user.createdAt instanceof Date ? user.createdAt.getTime() : Date.now();
    }
    const tokenAge = Date.now() - updatedAtTime;
    const maxAge = 24 * 60 * 60 * 1000;
    if (tokenAge > maxAge) {
      return res.status(400).json({ message: 'Verification link has expired. Please request a new verification email.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Do NOT delete short mapping immediately to allow clients (or retries) to load success page.
    // Deletion/cleanup can be handled asynchronously by a background job if needed.

    // Return the earlier-built successHtml
    return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('[VERIFY SHORT] Error processing short link:', error);
    return res.status(500).json({ message: 'An error occurred during email verification', error: error.message });
  }
});

// Resend verification email
router.post('/resend-verification', auth, async (req, res) => {
  try {
    // Ensure CORS headers for this authenticated endpoint as well
    try {
      const origin = req.headers && req.headers.origin ? req.headers.origin : (globalThis.env?.CLIENT_URL || process.env.CLIENT_URL || '*');
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Credentials', 'true');
    } catch (corsErr) {
      console.warn('[CORS] Could not set CORS headers on resend-verification response:', corsErr);
    }
    // Find user using D1 database
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User has already verified their email' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    try {
      const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);
      
      if (!emailSent) {
        console.error('[RESEND] Email sending returned false');
        return res.status(500).json({ 
          message: 'Verification email failed to send',
          error: 'Email sending returned false'
        });
      }
      
      return res.json({
        message: 'Verification email resent',
        emailSent: true
      });
    } catch (emailError) {
      console.error('[RESEND] Email error:', emailError.message);
      console.error('[RESEND] Email error details:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError), 2));
      return res.status(500).json({ 
        message: 'Verification email failed to send',
        error: emailError.message,
        details: emailError.toString()
      });
    }

  } catch (error) {
    console.error('[RESEND] Resend verification error:', error);
    console.error('[RESEND] Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Error resending verification email',
      error: error.message
    });
  }
});

export default router;