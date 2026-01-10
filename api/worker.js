// Import utility functions
import { makeCorsHeaders, makeHtmlResponse, checkRateLimit, checkRateLimitPersistent, checkRateLimitUpsert, generateVerificationToken, generateTempPassword, isValidEmail, validatePassword, logAnalyticsEvent } from './utils.js';

// Import authentication functions
import { hashPassword, verifyPassword, signJwt, verifyJwt, getPayloadFromHeader } from './auth.js';

// Import email functions
import { sendViaResend, sendViaSendGrid, sendVerificationEmail, sendResetPasswordEmail } from './email.js';

// Import PayPal functions
import { getPayPalAccessToken, createPayPalOrder, capturePayPalOrder, createCreditPurchaseOrder, captureCreditPurchase } from './paypal.js';

// Import database functions
import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUserCredits,
  getAllUsers,
  getAnalyticsStats,
  deleteUser,
  setVerificationToken,
  verifyUserByToken
} from './database.js';
import { ensureSchema } from './database.js';

// PayPal configuration

// Simple test function
function testFunction() {
  return 'test';
}

// Helper function to get analytics count with optional time filter
async function getAnalyticsCount(db, eventType, timeFilter = null) {
  let sql = 'SELECT COUNT(*) as count FROM analytics WHERE event_type = ?';
  const params = [eventType];

  if (timeFilter) {
    switch (timeFilter) {
      case 'today':
        sql += ' AND DATE(created_at) = DATE(\'now\')';
        break;
      case 'week':
        sql += ' AND created_at >= datetime(\'now\', \'-7 days\')';
        break;
      case 'month':
        sql += ' AND created_at >= datetime(\'now\', \'-30 days\')';
        break;
    }
  }

  try {
    const result = await db.prepare(sql).bind(...params).first();
    return result ? result.count : 0;
  } catch (error) {
    console.error(`Error getting analytics count for ${eventType}:`, error);
    return 0;
  }
}





// Require a verified user based on Authorization header.
// Returns the user object if verified, otherwise returns an object { errorResponse: Response } to return directly.
async function requireVerifiedFromHeader(authHeader, env) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { errorResponse: new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: makeCorsHeaders(null, env) }) };
  }
  const payload = await getPayloadFromHeader(authHeader, env);
  if (!payload) {
    return { errorResponse: new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401, headers: makeCorsHeaders(null, env) }) };
  }
  const userId = payload.sub || payload.userId;
  const user = await getUserById(env.DB, userId);
  if (!user) {
    return { errorResponse: new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: makeCorsHeaders(null, env) }) };
  }
  if (!user.is_verified || user.is_verified !== 1) {
    return { errorResponse: new Response(JSON.stringify({ message: 'Email verification required' }), { status: 403, headers: makeCorsHeaders(null, env) }) };
  }
  return { user };
}

// Helper to extract payload from either Authorization header or cookie-based auth
async function getPayloadFromRequest(request, env) {
  const authHeader = request.headers.get('authorization') || '';
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^|; )auth_token=([^;]+)/);
    if (match) token = match[2];
  }
  if (!token) return null;
  // try header-style verification first
  const payload = await getPayloadFromHeader(`Bearer ${token}`, env).then(p => {
    // getPayloadFromHeader returns payload or null (it throws inside), so handle
    return p && p.sub ? p : null;
  }).catch(() => null);
  if (payload) return payload;
  // fallback to direct jwt verify (older code path)
  try {
    const verified = await verifyJwt(token, env.JWT_SECRET);
    return verified;
  } catch (e) {
    return null;
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    // Ensure DB schema is present (run once)
    if (!globalThis.__schemaEnsured) {
      try {
        await ensureSchema(env.DB);
      } catch (e) {
        console.warn('ensureSchema failed:', e);
      }
      globalThis.__schemaEnsured = true;
    }
    const isDev = ((env.ENVIRONMENT || '').toLowerCase() === 'development' || (env.NODE_ENV || '').toLowerCase() === 'development');
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: makeCorsHeaders(request.headers.get('origin'), env), status: 204 });
    }

    const url = new URL(request.url);
    // compute CORS headers for this request origin to preserve backwards compatibility
    const corsHeaders = makeCorsHeaders(request.headers.get('origin'), env);

    // Rate limiting for sensitive endpoints
    const clientIP = request.headers.get('CF-Connecting-IP') ||
                    request.headers.get('X-Forwarded-For') ||
                    request.headers.get('X-Real-IP') ||
                    'unknown';

    // Stricter limits for authentication endpoints
    if (url.pathname.startsWith('/api/auth/') && (url.pathname.includes('/login') || url.pathname.includes('/register'))) {
      const rateLimitResult = await checkRateLimitUpsert(env.DB, `${clientIP}:auth`, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
      if (!rateLimitResult.allowed) {
        console.warn(`Rate limit exceeded for auth endpoint: ${clientIP}`);
        const retryAfterSeconds = rateLimitResult.resetTime ? Math.ceil(rateLimitResult.resetTime / 1000) : 60;
        return new Response(JSON.stringify({
          message: 'Too many authentication attempts. Please try again later.',
          retryAfter: retryAfterSeconds
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime || (Date.now() + 60 * 1000))
          }
        });
      }
    }

    // General API rate limiting
    const generalRateLimit = await checkRateLimitUpsert(env.DB, `${clientIP}:api`, 100, 15 * 60 * 1000); // 100 requests per 15 minutes
    if (!generalRateLimit.allowed) {
      console.warn(`Rate limit exceeded for API: ${clientIP}`);
      const retryAfterSeconds = generalRateLimit.resetTime ? Math.ceil(generalRateLimit.resetTime / 1000) : 60;
      return new Response(JSON.stringify({
        message: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSeconds
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Reset': String(generalRateLimit.resetTime || (Date.now() + 60 * 1000))
        }
      });
    }

    // NOTE: removed temporary catch-all response so real API routes (e.g. /api/generate) are reachable.

    // Health check endpoint
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'OK',
        message: 'Pawdia AI API is running on Cloudflare Workers',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production'
          }), {
            headers: corsHeaders
          });
    }

    // Logout endpoint - clear auth cookie (top-level)
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      try {
        const headersOut = new Headers(corsHeaders);
        // For cross-origin API usage set SameSite=None so browsers include the cookie on cross-site fetches.
        headersOut.append('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
        headersOut.set('Access-Control-Allow-Credentials', 'true');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: headersOut });
      } catch (e) {
        console.error('Logout error:', e);
        return new Response(JSON.stringify({ message: 'Logout failed' }), { status: 500, headers: corsHeaders });
      }
    }

    // Runtime configuration endpoint - return public PayPal client id and mode
    if (url.pathname === '/api/config' && request.method === 'GET') {
      try {
        const body = {
          paypalClientId: env.PAYPAL_CLIENT_ID || null,
          paypalMode: env.PAYPAL_MODE || 'live'
        };
        return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
      } catch (err) {
        console.error('Config endpoint error:', err);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Development-only: issue a debug JWT for a given user id (ONLY WHEN ENV=development)
    if (url.pathname === '/api/debug/issue-token' && request.method === 'POST') {
      // Only allow in development environment
      if ((env.ENVIRONMENT || '').toLowerCase() !== 'development') {
        return new Response(JSON.stringify({ message: 'Not allowed' }), { status: 403, headers: corsHeaders });
      }
      try {
        const body = await request.json().catch(() => ({}));
        const userId = body.userId;
        const isAdmin = !!body.isAdmin;
        if (!userId) {
          return new Response(JSON.stringify({ message: 'userId required' }), { status: 400, headers: corsHeaders });
        }
        const jwtSecret = env.JWT_SECRET;
        if (!jwtSecret) {
          return new Response(JSON.stringify({ message: 'JWT secret not configured' }), { status: 500, headers: corsHeaders });
        }
        const payload = { sub: userId, isAdmin };
        const token = await signJwt(payload, jwtSecret);
        return new Response(JSON.stringify({ token, payload }), { headers: corsHeaders });
      } catch (err) {
        console.error('Debug issue-token error:', err);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Debug endpoint: show Resend-related config (protected by DEBUG_TOKEN)
    if (url.pathname === '/api/debug/resend-config' && request.method === 'GET') {
      try {
        const debugToken = request.headers.get('x-debug-token') || '';
        if (!env.DEBUG_TOKEN || debugToken !== env.DEBUG_TOKEN) {
          return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403, headers: corsHeaders });
        }
        const hasResendKey = !!(env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== '');
        const resendFrom = env.RESEND_FROM || null;
        const resendDomain = env.RESEND_DOMAIN || null;
        return new Response(JSON.stringify({
          hasResendKey,
          resendFrom,
          resendDomain
        }), { headers: corsHeaders });
      } catch (err) {
        console.error('Resend-config debug error:', err);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Debug endpoint for testing
    if (url.pathname === '/api/debug' && request.method === 'GET') {
      try {
        const jwtSecretExists = !!env.JWT_SECRET;
        const dbTest = await env.DB.prepare('SELECT 1 as test').first();

        return new Response(JSON.stringify({
          jwtSecretExists,
          dbConnection: !!dbTest,
          dbTestResult: dbTest,
          timestamp: new Date().toISOString()
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Simple test endpoint
    if (url.pathname === '/api/test' && request.method === 'GET') {
      return new Response(JSON.stringify({
        message: 'API is working',
        timestamp: new Date().toISOString(),
        method: 'GET',
        path: '/api/test'
      }), {
        headers: corsHeaders
      });
    }

    // Minimal test endpoint
    if (url.pathname === '/api/minimal' && request.method === 'GET') {
      return new Response('OK', { status: 200 });
    }

    // Auth endpoints
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email, password } = body;

        // Get user from database
        const user = await getUserByEmail(env.DB, email);

        if (!user) {
          return new Response(JSON.stringify({
            message: 'User not found'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        // Verify password hash - support PBKDF2, legacy SHA-256, and bcrypt formats
        const storedHash = user.password || user.password_hash || '';
        if (!storedHash) {
          return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
        }

        let isValidPassword = false;
        let needsRehash = false;

        if (storedHash.startsWith('$pbkdf2-sha256$')) {
          // New PBKDF2 hash
          isValidPassword = await verifyPassword(password, storedHash);
        } else if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
          // Legacy bcrypt hash - temporarily allow admin login with demo123 for migration
          // TODO: Remove this after all users have migrated to new password hash
          if (user.is_admin === 1 && password === 'demo123') {
            isValidPassword = true;
            needsRehash = true; // Force password update on successful login
          }
        } else if (storedHash.match(/^[a-f0-9]{64}$/)) {
          // Legacy SHA-256 hash - needs migration
          isValidPassword = await verifyPassword(password, storedHash);
          if (isValidPassword) {
            needsRehash = true; // Upgrade to PBKDF2 on successful login
          }
        } else {
          // Unknown hash format
          console.warn('Unknown password hash format for user:', user.id);
          isValidPassword = false;
        }

        if (!isValidPassword) {
          return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
        }

        // Auto-upgrade password hash if using legacy format
        if (needsRehash) {
          try {
            const newHash = await hashPassword(password);
            await env.DB.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(newHash, user.id).run();
            console.log('Password hash upgraded for user:', user.id);
          } catch (rehashError) {
            console.warn('Failed to upgrade password hash for user:', user.id, rehashError);
            // Don't fail login if rehash fails, just log the error
          }
        }

        // Determine if this is the user's first login (based on last_login)
        const wasFirstLogin = !user.last_login;
        try {
          await env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
        } catch (e) {
          console.warn('Failed to update last_login for user:', e);
        }

        const jwtSecret = env.JWT_SECRET;
        if (!jwtSecret) {
          return new Response(JSON.stringify({ message: 'Server configuration error: JWT_SECRET not set' }), { status: 500, headers: corsHeaders });
        }
        const payload = { sub: user.id, isAdmin: user.is_admin === 1 };
        const signed = await signJwt(payload, jwtSecret);

        // Log login event
        await logAnalyticsEvent(env.DB, 'user_login', user.id, { email }, request);

        // Build response headers and set auth cookie (HttpOnly, Secure)
        const respHeaders = new Headers(corsHeaders);
        // Set cookie for HttpOnly authentication; keep token in body for backward compatibility
        const maxAge = 7 * 24 * 3600; // 7 days
        // Use SameSite=None for cross-origin frontend <-> API fetches so the HttpOnly cookie is included.
        const cookie = `auth_token=${signed}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
        respHeaders.append('Set-Cookie', cookie);
        // Allow credentials for cross-origin requests from frontend
        respHeaders.set('Access-Control-Allow-Credentials', 'true');

        return new Response(JSON.stringify({
          token: signed,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits || 0,
            isAdmin: user.is_admin === 1,
            isVerified: user.is_verified === 1
          },
          isFirstLogin: wasFirstLogin
        }), {
            headers: respHeaders
        });
      } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
            headers: corsHeaders
        });
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('authorization');
        // If no Authorization header, try cookie-based auth (auth_token)
        let tokenFromCookie = null;
        if (!authHeader) {
          const cookieHeader = request.headers.get('cookie') || '';
          const match = cookieHeader.match(/(^|; )auth_token=([^;]+)/);
          if (match) tokenFromCookie = match[2];
        }
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (!tokenFromCookie) {
          return new Response(JSON.stringify({
            message: 'No token provided'
          }), {
            status: 401,
            headers: corsHeaders
          });
          }
        }

        // Verify JWT and extract payload
        const payload = authHeader && authHeader.startsWith('Bearer ')
          ? await getPayloadFromHeader(authHeader, env)
          : await verifyJwt(tokenFromCookie, env.JWT_SECRET);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401, headers: corsHeaders });
        }
        const userId = payload.sub || payload.userId;
        const user = await getUserById(env.DB, userId);

        if (!user) {
          return new Response(JSON.stringify({
            message: 'User not found'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits || 0,
            isAdmin: user.is_admin === 1,
            isVerified: user.is_verified === 1
          }
        }), {
            headers: corsHeaders
        });
      } catch (error) {
        console.error('Auth check error:', error);
        return new Response(JSON.stringify({
          message: 'Server error',
          detail: String(error)
        }), {
          status: 500,
            headers: corsHeaders
        });
      }
    }

    if (url.pathname === '/api/auth/resend-verification' && request.method === 'POST') {
      // Stricter rate limiting for email resend (prevent email spam)
      const emailResendLimit = await checkRateLimitUpsert(env.DB, `${clientIP}:resend`, 3, 60 * 60 * 1000); // 3 requests per hour
      if (!emailResendLimit.allowed) {
        console.warn(`Rate limit exceeded for email resend: ${clientIP}`);
        const retryAfterSeconds = emailResendLimit.resetTime ? Math.ceil(emailResendLimit.resetTime / 1000) : 60;
        return new Response(JSON.stringify({
          message: 'Too many email resend requests. Please try again later.',
          retryAfter: retryAfterSeconds
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Reset': String(emailResendLimit.resetTime || (Date.now() + 60 * 1000))
          }
        });
      }

      try {
        // Support two modes:
        // 1) Authenticated request with Authorization: Bearer <token>
        // 2) Unauthenticated request that provides { email } in the POST body (for passwordless resend)
        const authHeader = request.headers.get('authorization');
        const body = await request.json().catch(() => ({}));

        let user = null;
        let actingViaAuth = false;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          console.log('[resend-verification] Starting token validation with JWT parsing');

          // Parse JWT token directly instead of calling /auth/me (avoiding potential recursion)
          try {
            // Decode JWT payload
            const parts = token.split('.');
            if (parts.length !== 3) {
              console.log('[resend-verification] Invalid JWT format');
              return new Response(JSON.stringify({ message: 'Invalid authentication token' }), { status: 401, headers: corsHeaders });
            }

            const payload = JSON.parse(atob(parts[1]));
            console.log('[resend-verification] JWT payload:', { sub: payload.sub, iat: payload.iat, exp: payload.exp });

            if (payload.sub) {
              console.log('[resend-verification] Looking up user by ID from JWT:', payload.sub);
              user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
              console.log('[resend-verification] Database lookup result:', user ? { id: user.id, email: user.email } : 'null');

              if (user) {
                actingViaAuth = true;
                console.log('[resend-verification] User found successfully via JWT parsing');
              } else {
                console.log('[resend-verification] User not found in database for ID:', payload.sub);
              }
            } else {
              console.log('[resend-verification] No user ID in JWT payload');
              return new Response(JSON.stringify({ message: 'Invalid authentication token' }), { status: 401, headers: corsHeaders });
            }
          } catch (jwtError) {
            console.error('[resend-verification] JWT parsing failed:', jwtError);
            return new Response(JSON.stringify({ message: 'Invalid authentication token' }), { status: 401, headers: corsHeaders });
          }
        }

        // If we don't have a user from token, try using the provided email
        if (!user && body && body.email) {
          try {
            const byEmail = await getUserByEmail(env.DB, String(body.email).trim().toLowerCase());
            if (byEmail) user = byEmail;
          } catch (e) {
            console.error('Error looking up user by email for resend:', e);
          }
        }

        if (!user) {
          // Don't reveal whether an email exists; respond with generic message for security.
          return new Response(JSON.stringify({ message: 'If that account exists, a verification email will be sent.' }), { headers: corsHeaders });
        }

        // Rate limit check (fail-open on DB errors)
        try {
          const row = await env.DB.prepare('SELECT last_verification_sent FROM users WHERE id = ?').bind(user.id).first();
          if (row && row.last_verification_sent) {
            const last = new Date(row.last_verification_sent);
            const now = new Date();
            const diffMs = now - last;
            const intervalEnv = env.RESEND_VERIFICATION_INTERVAL_MINUTES || env.RESEND_INTERVAL_MINUTES;
            const intervalMinutes = intervalEnv ? parseInt(String(intervalEnv), 10) : 5;
            const MIN_INTERVAL_MS = (!isNaN(intervalMinutes) && intervalMinutes > 0) ? intervalMinutes * 60 * 1000 : 5 * 60 * 1000;
            if (diffMs < MIN_INTERVAL_MS) {
              return new Response(JSON.stringify({ message: 'Too many requests. Please wait a few minutes before retrying.' }), { status: 429, headers: corsHeaders });
            }
          }
        } catch (e) {
          console.warn('Failed to check last_verification_sent (continuing):', e);
        }

        // Generate a new verification token and persist (best-effort)
        let verificationToken = null;
        try {
          verificationToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          await env.DB.prepare('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?').bind(verificationToken, expiresAt, user.id).run();
        } catch (e) {
          console.warn('Failed to set verification token via DB update (continuing):', e);
        }

        // Attempt to send verification email; don't fail the whole request on provider errors
        let sendResult = { sent: false, error: 'Unknown' };
        try {
          sendResult = await sendVerificationEmail(env, user.email, user.name || '', verificationToken || '');
        } catch (sendErr) {
          console.error('sendVerificationEmail threw exception:', sendErr);
          sendResult = { sent: false, error: String(sendErr) };
        }

        if (!sendResult.sent) {
          // Log failure and return a helpful message without exposing internal errors
          console.warn('Verification email not sent:', sendResult.error || sendResult.link);
          // Do NOT update last_verification_sent on failure so users can retry after transient provider errors.
          return new Response(JSON.stringify({ message: 'Unable to send verification email at this time. Please try again later.' }), { status: 200, headers: corsHeaders });
        }

        // Success path: log event and update timestamp
          try {
            await logAnalyticsEvent(env.DB, 'verification_sent', user.id, { email: user.email }, request);
          } catch (e) {
            console.warn('Failed to log verification_sent event:', e);
          }
          try {
            await env.DB.prepare('UPDATE users SET last_verification_sent = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
          } catch (e) {
            console.warn('Failed to update last_verification_sent:', e);
        }

        return new Response(JSON.stringify({ message: 'Verification email sent' }), { headers: corsHeaders });
      } catch (err) {
        console.error('Resend verification error (unexpected):', err && err.stack ? err.stack : err);
        // In development, include error detail to help debugging
        if ((env.ENVIRONMENT || '').toLowerCase() === 'development') {
          return new Response(JSON.stringify({ message: 'Server error', detail: String(err) }), { status: 500, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Registration endpoint - creates a new user with hashed password
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({ message: 'Email and password required' }), { status: 400, headers: corsHeaders });
        }

        // Check if user exists
        const existing = await getUserByEmail(env.DB, email);
        if (existing) {
          return new Response(JSON.stringify({ message: 'User already exists' }), { status: 409, headers: corsHeaders });
        }

        // Hash password with Web Crypto API
        const hash = await hashPassword(password);
        const userId = crypto.randomUUID();

        const created = await createUser(env.DB, { id: userId, email, name, password_hash: hash });
        if (!created) {
          return new Response(JSON.stringify({ message: 'Failed to create user' }), { status: 500, headers: corsHeaders });
        }

        // generate verification token and send verification email
        let emailSent = false;
        let emailError = null;
        try {
          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          try {
            await env.DB.prepare('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?').bind(token, expiresAt, userId).run();
          } catch (e) {
            console.error('Failed to set verification token via DB update:', e);
          }

          const sendResult = await sendVerificationEmail(env, email, name || '', token);
          if (sendResult.sent) {
            emailSent = true;
            try {
              await logAnalyticsEvent(env.DB, 'verification_sent', userId, {
                email,
                provider: sendResult.provider,
                fallback: sendResult.fallback || false
              }, request);
            } catch (e) {
              console.warn('Failed to log verification_sent event on registration:', e);
            }
          } else {
            emailError = sendResult.error;
            console.error('Verification email not sent on registration:', sendResult);
            // Log email failure for monitoring
            try {
              await logAnalyticsEvent(env.DB, 'email_send_failed', userId, {
                email,
                error: sendResult.error,
                primaryError: sendResult.primaryError,
                backupError: sendResult.backupError
              }, request);
            } catch (logErr) {
              console.warn('Failed to log email_send_failed event:', logErr);
            }
          }

          // Only update last_verification_sent when email was actually sent successfully.
          if (emailSent) {
            try {
              await env.DB.prepare('UPDATE users SET last_verification_sent = CURRENT_TIMESTAMP WHERE id = ?').bind(userId).run();
            } catch (e) {
              console.warn('Failed to update last_verification_sent on registration:', e);
            }
          }
        } catch (err) {
          console.error('Post-registration verification error:', err);
          emailError = String(err);
        }

        const responseMessage = emailSent
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful, but we were unable to send the verification email. Please try logging in and resending the verification email.';

        return new Response(JSON.stringify({
          message: responseMessage,
          user: {
            id: userId,
            email,
            name,
            credits: 0,
            isAdmin: false,
            isVerified: false
          },
          emailSent,
          emailError: emailSent ? null : emailError
        }), { headers: corsHeaders });
      } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Email verification endpoint - called by frontend with token
    if ((url.pathname === '/api/auth/verify' || url.pathname === '/api/auth/verify-email') && request.method === 'GET') {
      try {
        const token = url.searchParams.get('token');
        if (!token) {
          return new Response(JSON.stringify({ message: 'Token required' }), { status: 400, headers: corsHeaders });
        }
        const result = await verifyUserByToken(env.DB, token);
        if (result.success) {
          // Return updated user info for frontend to refresh state
          const user = result.user;
          return new Response(JSON.stringify({
            message: 'Email verified',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              credits: user.credits || 0,
              isAdmin: user.is_admin === 1,
              isVerified: user.is_verified === 1
            }
          }), { headers: corsHeaders });
        } else if (result.reason === 'expired') {
          return new Response(JSON.stringify({ message: 'Token expired' }), { status: 400, headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 400, headers: corsHeaders });
        }
      } catch (err) {
        console.error('Verify token error:', err);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // Verify and redirect - useful for email links that hit the backend directly
    if (url.pathname === '/api/auth/verify-redirect' && request.method === 'GET') {
      try {
        const token = url.searchParams.get('token');
        const frontendUrl = env.FRONTEND_URL || 'https://www.pawdia-ai.com';
        if (!token) {
          return Response.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=invalid`, 302);
        }
        const result = await verifyUserByToken(env.DB, token);
        if (result.success) {
          return Response.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-success`, 302);
        } else if (result.reason === 'expired') {
          return Response.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=expired`, 302);
        } else {
          return Response.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=invalid`, 302);
        }
      } catch (err) {
        console.error('Verify redirect error:', err);
        const frontendUrl = env.FRONTEND_URL || 'https://www.pawdia-ai.com';
        return Response.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=error`, 302);
      }
    }

    // Subscription endpoints
    if (url.pathname === '/api/subscriptions/subscribe' && request.method === 'POST') {
      try {
        // require verified user
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        // Update user subscription (mock implementation)
        // Plan handling: expect { plan: 'free' | 'pro' | 'premium' }
        const body = await request.json();
        const plan = body.plan || 'free';

        // For 'free' plan: set subscription active and grant 3 credits
        if (plan === 'free') {
          try {
            // Activate subscription and add 3 credits atomically
            await env.DB.prepare(
              'UPDATE users SET subscription_plan = ?, subscription_status = ?, credits = credits + 3, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind('free', 'active', userId).run();
            // Return new credits
            const row = await env.DB.prepare('SELECT credits, subscription_plan, subscription_status FROM users WHERE id = ?').bind(userId).first();
            return new Response(JSON.stringify({
              success: true,
              message: 'Free subscription activated. 3 credits granted.',
              credits: row.credits,
              subscription_plan: row.subscription_plan,
              subscription_status: row.subscription_status
            }), { headers: corsHeaders });
          } catch (err) {
            console.error('Subscribe free error:', err);
            return new Response(JSON.stringify({ message: 'Failed to activate subscription' }), { status: 500, headers: corsHeaders });
          }
        }

        // For paid plans: handle subscription with credits allocation
        try {
          // Determine credits based on plan
          let creditsToAdd = 0;
          if (plan === 'basic') creditsToAdd = 30;
          else if (plan === 'premium') creditsToAdd = 60;

          // Update user subscription and add credits
          await env.DB.prepare(
            'UPDATE users SET subscription_plan = ?, subscription_status = ?, credits = credits + ?, subscription_expires_at = datetime("now", "+30 days"), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(plan, 'active', creditsToAdd, userId).run();

          const row = await env.DB.prepare('SELECT credits, subscription_plan, subscription_status, COALESCE(subscription_expires, subscription_expires_at) as subscription_expires FROM users WHERE id = ?').bind(userId).first();
          return new Response(JSON.stringify({
            success: true,
            message: `${plan} subscription activated successfully. ${creditsToAdd} credits added.`,
            credits: row.credits,
            subscription_plan: row.subscription_plan,
            subscription_status: row.subscription_status,
            subscription_expires: row.subscription_expires
          }), { headers: corsHeaders });
        } catch (err) {
          console.error('Subscribe paid plan error:', err);
          return new Response(JSON.stringify({ message: 'Failed to create subscription' }), { status: 500, headers: corsHeaders });
        }
      } catch (error) {
        console.error('Subscription error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (url.pathname === '/api/subscriptions/credits/add' && request.method === 'POST') {
      try {
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        const body = await request.json();
        const { amount } = body;

        // Get current user
        const user = await getUserById(env.DB, userId);
        if (!user) {
          return new Response(JSON.stringify({
            message: 'User not found'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        // Add credits
        const newCredits = (user.credits || 0) + amount;
        await updateUserCredits(env.DB, userId, newCredits);

        return new Response(JSON.stringify({
          success: true,
          credits: newCredits
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Add credits error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (url.pathname === '/api/subscriptions/credits/use' && request.method === 'POST') {
      try {
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        const body = await request.json();
        const { amount } = body;

        // Get current user
        const user = await getUserById(env.DB, userId);
        if (!user) {
          return new Response(JSON.stringify({
            message: 'User not found'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        const currentCredits = user.credits || 0;
        if (currentCredits < amount) {
          return new Response(JSON.stringify({
            message: 'Insufficient credits'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Deduct credits
        const newCredits = currentCredits - amount;
        await updateUserCredits(env.DB, userId, newCredits);

        return new Response(JSON.stringify({
          success: true,
          credits: newCredits
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Use credits error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // PayPal Payment endpoints
    if (url.pathname === '/api/payments/create-order' && request.method === 'POST') {
      try {
        // Require verified user authentication
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        const body = await request.json();
        const { items, totalAmount, currency } = body;

        // Validate required fields
        if (!items || !Array.isArray(items) || !totalAmount || !currency) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: items, totalAmount, currency'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Get PayPal configuration
        const paypalMode = env.PAYPAL_MODE || 'live';
        const clientId = env.PAYPAL_CLIENT_ID;
        const clientSecret = env.PAYPAL_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error('PayPal credentials not configured');
          return new Response(JSON.stringify({
            error: 'Payment service not configured'
          }), {
            status: 500,
            headers: corsHeaders
          });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalMode);

        // Create PayPal order
        const orderData = {
          items,
          totalAmount,
          currency
        };

        const orderResult = await createPayPalOrder(accessToken, orderData, paypalMode);

        // Store payment record in database
        const paymentId = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO payments (id, user_id, paypal_order_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(paymentId, userId, orderResult.id, totalAmount, currency, 'pending').run();

        return new Response(JSON.stringify({
          orderId: orderResult.id,
          status: 'CREATED'
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('Create PayPal order error:', error);
        return new Response(JSON.stringify({
          error: error.message || 'Failed to create payment order'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (url.pathname.startsWith('/api/payments/capture-order/') && request.method === 'POST') {
      try {
        // Require verified user authentication
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        // Extract order ID from URL
        const orderId = url.pathname.split('/api/payments/capture-order/')[1];
        if (!orderId) {
          return new Response(JSON.stringify({
            error: 'Order ID required'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Get PayPal configuration
        const paypalMode = env.PAYPAL_MODE || 'live';
        const clientId = env.PAYPAL_CLIENT_ID;
        const clientSecret = env.PAYPAL_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error('PayPal credentials not configured');
          return new Response(JSON.stringify({
            error: 'Payment service not configured'
          }), {
            status: 500,
            headers: corsHeaders
          });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalMode);

        // Capture PayPal payment
        const captureResult = await capturePayPalPayment(accessToken, orderId, paypalMode);

        // Update payment record in database
        await env.DB.prepare(
          'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE paypal_order_id = ? AND user_id = ?'
        ).bind('completed', orderId, userId).run();

        // Process credits based on payment (this is a simple implementation)
        // In a real app, you'd parse the order details to determine credits
        const paymentRecord = await env.DB.prepare(
          'SELECT * FROM payments WHERE paypal_order_id = ? AND user_id = ?'
        ).bind(orderId, userId).first();

        if (paymentRecord && paymentRecord.credits_purchased) {
          // Add credits to user account
          const currentUser = await getUserById(env.DB, userId);
          const newCredits = (currentUser.credits || 0) + paymentRecord.credits_purchased;
          await updateUserCredits(env.DB, userId, newCredits);
        }

        return new Response(JSON.stringify({
          orderId,
          captureId: captureResult.id,
          status: captureResult.status
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('Capture PayPal payment error:', error);
        return new Response(JSON.stringify({
          error: error.message || 'Failed to capture payment'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (url.pathname === '/api/payments/user-orders' && request.method === 'GET') {
      try {
        // Require verified user authentication
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        // Get user payment history
        const payments = await env.DB.prepare(
          'SELECT id, paypal_order_id, amount, currency, status, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC'
        ).bind(userId).all();

        const orders = payments.results.map(payment => ({
          id: payment.id,
          paypalOrderId: payment.paypal_order_id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.created_at
        }));

        return new Response(JSON.stringify({
          orders
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('Get user orders error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get user orders'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Process credit purchase after PayPal payment
    if (url.pathname === '/api/payments/process-credits' && request.method === 'POST') {
      try {
        // Require verified user authentication
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const userId = vCheck.user.id;

        const body = await request.json();
        const { orderId, captureId, credits } = body;

        if (!orderId || !captureId || !credits) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: orderId, captureId, credits'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Update payment record with credits purchased
        await env.DB.prepare(
          'UPDATE payments SET credits_purchased = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE paypal_order_id = ? AND user_id = ?'
        ).bind(credits, 'completed', orderId, userId).run();

        // Add credits to user account
        const currentUser = await getUserById(env.DB, userId);
        const newCredits = (currentUser.credits || 0) + credits;
        await updateUserCredits(env.DB, userId, newCredits);

        return new Response(JSON.stringify({
          success: true,
          credits: newCredits,
          message: `${credits} credits added to your account`
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('Process credits error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to process credit purchase'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Analytics endpoints
    if (url.pathname === '/api/analytics/page-view' && request.method === 'POST') {
      try {
        // Log page view event
        await logAnalyticsEvent(env.DB, 'page_view', null, null, request);
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Analytics error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (url.pathname.startsWith('/api/admin/users') && request.method === 'GET') {
      try {
        const payload = await getPayloadFromRequest(request, env);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: corsHeaders });
        }
        const userId = payload.sub || payload.userId;
        const user = await getUserById(env.DB, userId);
        if (!user || user.is_admin !== 1) {
          return new Response(JSON.stringify({ message: 'Admin access required' }), { status: 403, headers: corsHeaders });
        }

        // Get search and pagination parameters
        const urlObj = new URL(request.url);
        const searchTerm = (urlObj.searchParams.get('search') || '').trim();
        const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1', 10));
        const perPage = Math.max(1, Math.min(200, parseInt(urlObj.searchParams.get('perPage') || '50', 10)));
        const offset = (page - 1) * perPage;

        // Build count query
        let countSql = 'SELECT COUNT(*) as cnt FROM users';
        let selectSql = 'SELECT id, name, email, avatar, credits, is_verified, is_admin, created_at, subscription_plan, subscription_status FROM users';
        const params = [];
        if (searchTerm) {
          countSql += ' WHERE email LIKE ? OR name LIKE ?';
          selectSql += ' WHERE email LIKE ? OR name LIKE ?';
          params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }
        selectSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        // Execute count
        const countRow = await env.DB.prepare(countSql).bind(...params).first();
        const total = countRow && countRow.cnt ? Number(countRow.cnt) : 0;

        // Execute select with pagination
        const selectParams = params.slice();
        selectParams.push(perPage, offset);
        const rows = await env.DB.prepare(selectSql).bind(...selectParams).all();
        const users = rows && rows.results ? rows.results : [];

        return new Response(JSON.stringify({
          users,
          total,
          page,
          perPage
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Admin users error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Admin endpoints for user management
    if (url.pathname.startsWith('/api/admin/users/') && (request.method === 'DELETE' || request.method === 'POST' || request.method === 'PUT')) {
      try {
        // Helper validation utilities for admin routes
        const isValidUserId = (id) => typeof id === 'string' && id.trim() !== '' && id !== 'null';
        const clampNumber = (n, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => {
          const v = Number(n);
          if (!Number.isFinite(v)) return null;
          return Math.max(min, Math.min(max, v));
        };
        const allowedPlans = ['free', 'basic', 'premium', 'custom'];
        const isValidIsoDateOrSpecial = (s) => {
          if (!s) return true;
          if (s === 'PERMANENT') return true;
          const d = new Date(s);
          return !isNaN(d.getTime());
        };
        const payload = await getPayloadFromRequest(request, env);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: corsHeaders });
        }
        const userId = payload.sub || payload.userId;
        const adminUser = await getUserById(env.DB, userId);
        if (!adminUser) {
          return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: corsHeaders });
        }
        if (adminUser.is_admin !== 1) {
          return new Response(JSON.stringify({ message: 'Admin access required' }), { status: 403, headers: corsHeaders });
        }

        // Extract target user id from path: /api/admin/users/:id/...
        const parts = url.pathname.split('/').filter(Boolean);
        // parts example: ['api','admin','users','<id>','credits','add']
        const targetId = parts[3];
        if (!targetId) {
          return new Response(JSON.stringify({ message: 'User id required' }), { status: 400, headers: corsHeaders });
        }

        // Route: DELETE /api/admin/users/:id
        if (request.method === 'DELETE' && parts.length === 4) {
          console.log('DELETE operation requested for user ID:', targetId);
          console.log('Admin user ID:', adminUser.id);

          // Prevent deleting self
          if (targetId === adminUser.id) {
            console.log('Cannot delete own account');
            return new Response(JSON.stringify({ message: 'Cannot delete your own account' }), { status: 403, headers: corsHeaders });
          }

          const targetUser = await getUserById(env.DB, targetId);
          console.log('Target user found:', !!targetUser);
          if (targetUser) {
            console.log('Target user data:', {
              id: targetUser.id,
              email: targetUser.email,
              is_admin: targetUser.is_admin,
              is_verified: targetUser.is_verified
            });
          }

          if (!targetUser) {
            console.log('User not found');
            return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: corsHeaders });
          }
          if (targetUser.is_admin === 1) {
            console.log('Cannot delete admin account');
            return new Response(JSON.stringify({ message: 'Cannot delete an admin account' }), { status: 403, headers: corsHeaders });
          }

          console.log('Proceeding with user deletion');

          try {
            const deleted = await deleteUser(env.DB, targetId);
            // Temporarily disable analytics logging to test if it's causing the 500 error
            // Log analytics event (non-blocking - don't fail the delete operation if logging fails)
            // try {
            //   await logAnalyticsEvent(env.DB, 'admin_delete_user', adminUser.id, { targetId }, request);
            // } catch (logErr) {
            //   console.warn('Failed to log admin delete event (non-critical):', logErr);
            // }
            console.log('User deletion completed successfully');
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
          } catch (delErr) {
            console.error('Delete user failed:', delErr && delErr.stack ? delErr.stack : delErr);
            // Return detail to client for debugging (will be visible in response)
            const detail = delErr && delErr.message ? delErr.message : String(delErr);
            return new Response(JSON.stringify({ message: 'Server error', detail }), { status: 500, headers: corsHeaders });
          }
        }

        // POST actions: credits add/remove/set or reset-password
        if (request.method === 'POST') {
          // /api/admin/users/:id/credits/add|remove|set
          if (parts.length >= 6 && parts[4] === 'credits') {
            const action = parts[5]; // add | remove | set
            const body = await request.json().catch(() => ({}));
            const rawAmount = body.amount;
            // validate amount depending on action
            if (action === 'set') {
              if (typeof rawAmount === 'undefined') {
                return new Response(JSON.stringify({ message: 'Missing amount for set operation' }), { status: 400, headers: corsHeaders });
              }
            } else {
              if (typeof rawAmount === 'undefined') {
                return new Response(JSON.stringify({ message: 'Missing amount' }), { status: 400, headers: corsHeaders });
              }
            }
            const amount = Number(rawAmount);
            if (!Number.isFinite(amount)) {
              return new Response(JSON.stringify({ message: 'Invalid amount' }), { status: 400, headers: corsHeaders });
            }
            // clamp to reasonable bounds to avoid abuse
            const CLAMP_MIN = -100000;
            const CLAMP_MAX = 100000;
            const safeAmount = clampNumber(amount, CLAMP_MIN, CLAMP_MAX);
            if (safeAmount === null) {
              return new Response(JSON.stringify({ message: 'Amount out of bounds' }), { status: 400, headers: corsHeaders });
            }

            const user = await getUserById(env.DB, targetId);
            if (!user) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: corsHeaders });

            let newCredits = Number(user.credits || 0);
            if (action === 'add') {
              newCredits = newCredits + safeAmount;
            } else if (action === 'remove' || action === 'subtract') {
              newCredits = Math.max(0, newCredits - Math.abs(safeAmount));
            } else if (action === 'set') {
              const setVal = safeAmount;
              if (!Number.isFinite(setVal) || setVal < 0) {
                return new Response(JSON.stringify({ message: 'Invalid set value' }), { status: 400, headers: corsHeaders });
              }
              newCredits = Math.max(0, Math.floor(setVal));
            } else {
              return new Response(JSON.stringify({ message: 'Invalid credit operation' }), { status: 400, headers: corsHeaders });
            }

            const ok = await updateUserCredits(env.DB, targetId, newCredits);
            await logAnalyticsEvent(env.DB, 'admin_credit_operation', adminUser.id, { targetId, action, amount, newCredits }, request);
            if (!ok) return new Response(JSON.stringify({ message: 'Failed to update credits' }), { status: 500, headers: corsHeaders });
            return new Response(JSON.stringify({ success: true, credits: newCredits }), { headers: corsHeaders });
          }

          // /api/admin/users/:id/reset-password
          if (parts.length >= 5 && parts[4] === 'reset-password') {
            const body = await request.json().catch(() => ({}));
            const newPassword = body.newPassword || null;
            // validate password length if provided
            if (newPassword && newPassword.length < 6) {
              return new Response(JSON.stringify({ message: 'Password must be at least 6 characters' }), { status: 400, headers: corsHeaders });
            }
            // If no password provided, generate a temporary one
            const tempPassword = newPassword || ('tmp-' + Math.random().toString(36).slice(2, 10));
            const hash = await hashPassword(tempPassword);
            try {
              await env.DB.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(hash, targetId).run();
              await logAnalyticsEvent(env.DB, 'admin_reset_password', adminUser.id, { targetId }, request);
              // Send temporary password to user's email via Resend; do not return it in the API response.
              try {
                const mailResult = await sendResetPasswordEmail(env, user.email, user.name || '', tempPassword);
                if (!mailResult.sent) {
                  console.warn('Failed to send reset password email:', mailResult.error || mailResult.temp);
                }
              } catch (mailErr) {
                console.warn('Error sending reset password email:', mailErr);
              }
              return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            } catch (e) {
              console.error('Reset password error:', e);
              return new Response(JSON.stringify({ message: 'Failed to reset password' }), { status: 500, headers: corsHeaders });
            }
          }
        }

        // PUT actions: subscription update
        if (request.method === 'PUT' && parts.length >= 5 && parts[4] === 'subscription') {
          const body = await request.json().catch(() => ({}));
          console.log('Subscription update request body:', body);
          // Allowed fields: plan, status, expiresAt, setCredits, addPlanCredits
          const updates = [];
          const params = [];
          if (typeof body.plan !== 'undefined') {
            if (!allowedPlans.includes(body.plan)) {
              return new Response(JSON.stringify({ message: 'Invalid subscription plan' }), { status: 400, headers: corsHeaders });
            }
            updates.push('subscription_plan = ?'); params.push(body.plan);
          }
          if (typeof body.status !== 'undefined') {
            updates.push('subscription_status = ?'); params.push(body.status);
          }
          if (typeof body.expiresAt !== 'undefined') {
            if (!isValidIsoDateOrSpecial(body.expiresAt)) {
              return new Response(JSON.stringify({ message: 'Invalid expiresAt value' }), { status: 400, headers: corsHeaders });
            }
            updates.push('subscription_expires_at = ?'); params.push(body.expiresAt);
          }
          console.log('Updates array:', updates);
          console.log('Params array:', params);
          try {
            if (updates.length > 0) {
              const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
              params.push(targetId);
              console.log('Final SQL:', sql);
              console.log('Final params:', params);
              const result = await env.DB.prepare(sql).bind(...params).run();
              console.log('SQL execution result:', result);
            }
            // Handle credits changes
            if (typeof body.setCredits !== 'undefined') {
              const setVal = Number(body.setCredits);
              if (Number.isFinite(setVal) && setVal >= 0 && setVal <= 100000) {
                await updateUserCredits(env.DB, targetId, Math.floor(setVal));
              } else {
                return new Response(JSON.stringify({ message: 'Invalid setCredits value' }), { status: 400, headers: corsHeaders });
              }
            } else if (body.addPlanCredits) {
              // Optionally add default plan credits (example: +3)
              const user = await getUserById(env.DB, targetId);
              const add = 3;
              if (user) {
                const newCredits = (user.credits || 0) + add;
                await updateUserCredits(env.DB, targetId, newCredits);
              }
            }
            await logAnalyticsEvent(env.DB, 'admin_update_subscription', adminUser.id, { targetId, body }, request);
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
          } catch (e) {
            console.error('Subscription update error:', e);
            return new Response(JSON.stringify({ message: 'Failed to update subscription' }), { status: 500, headers: corsHeaders });
          }
        }

        return new Response(JSON.stringify({ message: 'Admin endpoint not found' }), { status: 404, headers: corsHeaders });
      } catch (error) {
        // Log full error stack for debugging, but return a generic message to client
        console.error('Admin users route error:', error && error.stack ? error.stack : error);
        const message = (error && error.message) ? error.message : 'Server error';
        return new Response(JSON.stringify({ message: 'Server error', detail: message }), { status: 500, headers: corsHeaders });
      }
    }

    if (url.pathname === '/api/admin/analytics/stats' && request.method === 'GET') {
      try {
        const payload = await getPayloadFromRequest(request, env);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: corsHeaders });
        }
        const user = await getUserById(env.DB, payload.sub || payload.userId);
        if (!user || user.is_admin !== 1) {
          return new Response(JSON.stringify({ message: 'Admin access required' }), { status: 403, headers: corsHeaders });
        }

        const stats = await getAnalyticsStats(env.DB);

        return new Response(JSON.stringify(stats), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Admin analytics error:', error);
        return new Response(JSON.stringify({
          message: 'Server error'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // AI generation endpoint (support both /generate and /api/generate for compatibility)
    if ((url.pathname === '/generate' || url.pathname === '/api/generate') && request.method === 'POST') {
      try {
        const body = await request.json();
        // Require verified user before allowing generation
        const authHeader = request.headers.get('authorization');
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const requester = vCheck.user;

        const AI_KEY = env.AI_API_KEY;
        const AI_BASE = env.AI_API_BASE_URL || 'https://api.apiyi.com/v1';
        const AI_MODEL = env.AI_MODEL || 'gemini-2.5-flash-image';

        if (!AI_KEY || AI_KEY.trim() === '') {
          console.error('AI service not configured: AI_API_KEY missing');
          return new Response(JSON.stringify({ error: 'AI service not configured on server' }), {
            status: 500,
            headers: corsHeaders
          });
        }

        const providerPayload = {
          model: AI_MODEL,
          prompt: body.prompt,
          width: body.width || 512,
          height: body.height || 512,
          steps: body.steps,
          cfgScale: body.cfgScale,
          negative_prompt: body.negativePrompt
        };

        // If the frontend included an imageBase64 for image-to-image, include it in provider payload.
        if (body.imageBase64) {
          // Build a proper data URI using the provided mime type (frontend sends imageMimeType)
          const mimeType = body.imageMimeType || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${body.imageBase64}`;

          // Many image APIs expect 'init_image' or 'image' keys; include both for compatibility.
          providerPayload.init_image = dataUri;
          providerPayload.image = dataUri;
          // Some providers expect an array of init images
          providerPayload.init_images = [dataUri];
          // Some providers accept base64 array variants
          providerPayload.init_images_b64 = [body.imageBase64];
          providerPayload.init_images_base64 = [body.imageBase64];

          // Interpret image_strength conservatively: lower => preserve original more.
          // Default to 0.15 to prioritize preserving original composition and details.
          const preserveStrength = (typeof body.image_strength !== 'undefined') ? body.image_strength : 0.15;

          // Send multiple common variants so different providers pick the field they expect.
          providerPayload.image_strength = preserveStrength;
          providerPayload.strength = preserveStrength;
          providerPayload.init_strength = preserveStrength;

          // mark mode for backend logs
          providerPayload.mode = 'image_to_image';
          if (isDev) console.log('Image-to-image payload prepared: mime=', mimeType, 'strength=', preserveStrength);
        }
        if (isDev) console.log('Calling AI API with payload:', providerPayload);

        // Server-side protection: limit payload size (chars) to avoid 413 from upstream
        const maxChars = parseInt(String(env.MAX_PAYLOAD_CHARS || env.MAX_IMAGE_B64_CHARS || '6000000'), 10);
        try {
          const providerPayloadStr = JSON.stringify(providerPayload);
          if (providerPayloadStr.length > maxChars) {
            return new Response(JSON.stringify({ error: 'Payload too large. Please reduce image size or quality before retrying.' }), { status: 413, headers: corsHeaders });
          }
        } catch (e) {
          // if stringify fails, continue and let provider handle; but log in dev
          if (isDev) console.warn('Failed to stringify providerPayload for size check', e);
        }

        let frontendResponse = null;
        let statusCode = 200;

        if (body.imageBase64) {
          // Use Gemini-style content generate endpoint for mixed text+image (img2img)
          const mimeType = body.imageMimeType || 'image/jpeg';
          const preserveStrength = (typeof body.image_strength !== 'undefined') ? body.image_strength : 0.15;

          const geminiRequest = {
            // include common compatibility fields at top-level
            model: AI_MODEL,
            prompt: body.prompt || '',
            mode: 'image_to_image',
            // include images both as inline_data (Gemini style) and top-level fields for providers that expect them
            init_image: `data:${mimeType};base64,${body.imageBase64}`,
            image: `data:${mimeType};base64,${body.imageBase64}`,
            image_strength: preserveStrength,
            strength: preserveStrength,
            init_strength: preserveStrength,
            contents: [
              {
                parts: [
                  { text: body.prompt || '' },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: body.imageBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              // pass through optional fields if present
              ...(body.seed !== undefined && { seed: body.seed }),
              ...(body.cfgScale !== undefined && { cfgScale: body.cfgScale })
            }
          };

          console.log('Calling Gemini content generate for img2img with config:', { mimeType, preserveStrength });

          const geminiResp = await fetch(`${AI_BASE}/models/${AI_MODEL}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_KEY}`
            },
            body: JSON.stringify(geminiRequest)
          });

          statusCode = geminiResp.status || 200;
          const geminiJson = await geminiResp.json();
          console.log('Gemini content API response:', geminiJson);

          // Try to parse Gemini-style response (candidates -> content -> parts)
          try {
            if (geminiJson.candidates && geminiJson.candidates[0] && geminiJson.candidates[0].content && geminiJson.candidates[0].content.parts) {
              const parts = geminiJson.candidates[0].content.parts;
              for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
                  frontendResponse = { base64: part.inlineData.data, created: geminiJson.created || Date.now() };
                  break;
                } else if (part.inline_data && part.inline_data.mime_type && part.inline_data.data) {
                  // alternative key casing
                  frontendResponse = { base64: part.inline_data.data, created: geminiJson.created || Date.now() };
                  break;
                } else if (part.text && typeof part.text === 'string' && part.text.includes('http')) {
                  const urlMatch = part.text.match(/https?:\/\/[^\s'"]+/);
                  if (urlMatch) {
                    frontendResponse = { imageUrl: urlMatch[0], created: geminiJson.created || Date.now() };
                    break;
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Failed to parse Gemini response parts:', e);
          }

          // Fallback parsing similar to images/generations format
          if (!frontendResponse) {
            if (geminiJson.data && geminiJson.data[0]) {
              const imageData = geminiJson.data[0];
              if (imageData.b64_json) frontendResponse = { base64: imageData.b64_json, created: geminiJson.created };
              else if (imageData.url) frontendResponse = { imageUrl: imageData.url, created: geminiJson.created };
            }
          }

          if (!frontendResponse) {
            // As a last resort return raw provider response for debugging
            frontendResponse = { raw: geminiJson };
          }
        } else {
          // No image: use existing images/generations path
          const aiResp = await fetch(`${AI_BASE}/images/generations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_KEY}`
            },
            body: JSON.stringify(providerPayload)
          });

          statusCode = aiResp.status || 200;
          const aiJson = await aiResp.json();
          console.log('AI API response:', aiJson);

          if (aiJson.data && aiJson.data[0]) {
            const imageData = aiJson.data[0];
            if (imageData.b64_json) {
              frontendResponse = { base64: imageData.b64_json, created: aiJson.created };
            } else if (imageData.url) {
              frontendResponse = { imageUrl: imageData.url, created: aiJson.created };
            } else {
              frontendResponse = aiJson;
            }
          } else {
            frontendResponse = aiJson;
          }
        }

        console.log('Converted response for frontend:', frontendResponse);

        return new Response(JSON.stringify(frontendResponse), {
          status: statusCode,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Generate endpoint error:', error);
        return new Response(JSON.stringify({
          error: 'Internal server error',
          detail: String(error)
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Email monitoring endpoint - Admin only
    if (url.pathname === '/api/admin/email-stats' && request.method === 'GET') {
      try {
        // Accept either Authorization header or cookie-based auth
        const payload = await getPayloadFromRequest(request, env);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: corsHeaders });
        }
        const user = await getUserById(env.DB, payload.sub || payload.userId);
        if (!user || (user.is_admin !== 1 && user.isAdmin !== true)) {
          return new Response(JSON.stringify({ message: 'Admin access required' }), { status: 403, headers: corsHeaders });
        }

        // Get email statistics from analytics
        const stats = {
          verification_sent: await getAnalyticsCount(env.DB, 'verification_sent'),
          verification_sent_today: await getAnalyticsCount(env.DB, 'verification_sent', 'today'),
          verification_sent_week: await getAnalyticsCount(env.DB, 'verification_sent', 'week'),
          email_send_failed: await getAnalyticsCount(env.DB, 'email_send_failed'),
          email_send_failed_today: await getAnalyticsCount(env.DB, 'email_send_failed', 'today'),
          verification_success: await getAnalyticsCount(env.DB, 'verification_success'),
          verification_success_today: await getAnalyticsCount(env.DB, 'verification_success', 'today')
        };

        // Get recent email events
        const recentEvents = await env.DB.prepare(`
          SELECT event_type, user_id, data as metadata, created_at
          FROM analytics
          WHERE event_type IN ('verification_sent', 'email_send_failed', 'verification_success')
          ORDER BY created_at DESC
          LIMIT 50
        `).all();

        return new Response(JSON.stringify({
          stats,
          recentEvents: recentEvents.results || []
        }), { headers: corsHeaders });

      } catch (error) {
        console.error('Email stats error:', error);
        return new Response(JSON.stringify({ message: 'Server error' }), { status: 500, headers: corsHeaders });
      }
    }

    // 404 handler
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      path: url.pathname
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};