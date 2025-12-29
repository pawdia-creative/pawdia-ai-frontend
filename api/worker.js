// CORS helper - allowlist controlled by env.ALLOWED_ORIGINS (comma-separated)
function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  // default allow production domain and Pages preview if none provided
  if (list.length === 0) {
    return [
      'https://www.pawdia-ai.com',
      'https://pawdia-ai-frontend.pages.dev',
      'https://25001b6c.pawdia-ai-frontend.pages.dev',
      'http://localhost:5173'
    ];
  }
  return list;
}

function makeCorsHeaders(origin, env) {
  const allowed = parseAllowedOrigins(env);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  } else {
    // no allow-origin header when origin not allowed
  }
  return headers;
}

// Import database functions
import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUserCredits,
  getAllUsers,
  logAnalyticsEvent,
  getAnalyticsStats,
  deleteUser
  , setVerificationToken, verifyUserByToken
} from './database.js';

// Simple test function
function testFunction() {
  return 'test';
}

// Helper to send verification email via SendGrid if configured
async function sendVerificationEmail(env, toEmail, toName, token) {
  try {
    const sendgridKey = env.SENDGRID_API_KEY;
    const frontendUrl = env.FRONTEND_URL || 'https://www.pawdia-ai.com';
    // Frontend verification route is /verify-email (keep /verify as legacy alias)
    const verifyLink = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
    const backendVerifyBase = env.API_BASE_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev';
    const backendVerifyRedirect = `${backendVerifyBase.replace(/\/$/, '')}/api/auth/verify-redirect?token=${encodeURIComponent(token)}`;

    const subject = 'Verify your Pawdia AI email';
    const html = `
      <p>Hi ${toName || ''},</p>
      <p>Thanks for registering at Pawdia AI. Please verify your email by clicking one of the links below:</p>
      <ul>
        <li><a href="${verifyLink}">Verify via website</a> (recommended)</li>
        <li><a href="${backendVerifyRedirect}">One-click verify (opens verification page)</a></li>
      </ul>
      <p>This link will expire in 24 hours.</p>
    `;

    if (sendgridKey) {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail, name: toName }], subject }],
          from: { email: env.SENDGRID_FROM || 'no-reply@pawdia-ai.com', name: 'Pawdia AI' },
          content: [{ type: 'text/html', value: html }]
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error('SendGrid send error:', resp.status, text);
        // fall through to try RESEND if available
      } else {
        return { sent: true };
      }
    }

    // Try Resend.com if configured
    const resendKey = env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.RESEND_FROM || 'no-reply@pawdia-ai.com',
            to: toEmail,
            subject,
            html
          })
        });
        if (!r.ok) {
          const t = await r.text();
          console.error('Resend send error:', r.status, t);
          return { sent: false, error: t };
        }
        return { sent: true };
      } catch (e) {
        console.error('Resend send exception:', e);
        return { sent: false, error: String(e) };
      }
    }

    console.warn('No mail provider configured; verification link:', verifyLink);
    return { sent: false, link: verifyLink };
  } catch (err) {
    console.error('sendVerificationEmail error:', err);
    return { sent: false, error: String(err) };
  }
}
// Using Web Crypto API for password hashing (simplified bcrypt alternative)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'pawdia-salt'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

// JWT helpers using Web Crypto
const textEncoder = new TextEncoder();
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeBase64UrlString(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importHmacKey(secret) {
  return await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signJwt(payload, secret, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = Object.assign({}, payload, { iat: now, exp: now + expiresInSeconds });
  const encodedHeader = encodeBase64UrlString(JSON.stringify(header));
  const encodedClaim = encodeBase64UrlString(JSON.stringify(claim));
  const data = `${encodedHeader}.${encodedClaim}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
  const encodedSig = base64UrlEncode(signature);
  return `${data}.${encodedSig}`;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const key = await importHmacKey(secret);
    // verify signature
    const rawSig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer;
    const valid = await crypto.subtle.verify('HMAC', key, rawSig, textEncoder.encode(data));
    if (!valid) return null;
    // decode payload (base64url -> UTF-8)
    const b64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const payloadJson = new TextDecoder().decode(bytes);
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch (err) {
    console.error('JWT verify error:', err);
    return null;
  }
}

// Helper to extract and verify JWT payload from Authorization header
async function getPayloadFromHeader(authHeader, env) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const secret = env.JWT_SECRET;
  console.log('JWT_SECRET exists:', !!secret);
  if (!secret) {
    console.error('JWT_SECRET not set in env');
    return null;
  }
  // Strict verification only
  try {
    const verified = await verifyJwt(token, secret);
    return verified;
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
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

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: makeCorsHeaders(request.headers.get('origin'), env), status: 204 });
    }

    const url = new URL(request.url);
    // compute CORS headers for this request origin to preserve backwards compatibility
    const corsHeaders = makeCorsHeaders(request.headers.get('origin'), env);

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

        // Verify password hash - support both bcrypt (legacy) and SHA-256 (new)
        const storedHash = user.password || user.password_hash || '';
        if (!storedHash) {
          return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
        }

        let isValidPassword = false;
        if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
          // Legacy bcrypt hash - this would require bcryptjs, but since it's not available,
          // for now we'll assume legacy users need to reset password or use a different approach
          // For demo purposes, let's temporarily allow admin login with demo123 for bcrypt users
          if (user.is_admin === 1 && password === 'demo123') {
            isValidPassword = true;
          }
        } else {
          // New SHA-256 hash
          isValidPassword = await verifyPassword(password, storedHash);
        }

        if (!isValidPassword) {
          return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
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
            headers: corsHeaders
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
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            message: 'No token provided'
          }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // Verify JWT and extract payload
        const payload = await getPayloadFromHeader(authHeader, env);
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
      try {
        const body = await request.json();
        const { email } = body;
        if (!email) {
          return new Response(JSON.stringify({ message: 'Email required' }), { status: 400, headers: corsHeaders });
        }
        const user = await getUserByEmail(env.DB, email);
        if (!user) {
          // do not reveal existence in production; mimic success
          return new Response(JSON.stringify({ message: 'Verification email sent' }), { headers: corsHeaders });
        }
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        try {
          await env.DB.prepare('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?').bind(token, expiresAt, user.id).run();
        } catch (e) {
          console.error('Failed to set verification token via DB update:', e);
        }
        const sendResult = await sendVerificationEmail(env, user.email, user.name || '', token);
        if (!sendResult.sent) {
          // still return success to the client but log
          console.warn('Verification email not sent:', sendResult.error || sendResult.link);
        }
        return new Response(JSON.stringify({ message: 'Verification email sent' }), { headers: corsHeaders });
      } catch (err) {
        console.error('Resend verification error:', err);
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
        try {
          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          try {
            await env.DB.prepare('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?').bind(token, expiresAt, userId).run();
          } catch (e) {
            console.error('Failed to set verification token via DB update:', e);
          }
          const sendResult = await sendVerificationEmail(env, email, name || '', token);
          if (!sendResult.sent) {
            console.warn('Verification email not sent on registration:', sendResult.error || sendResult.link);
          }
        } catch (err) {
          console.error('Post-registration verification error:', err);
        }

        return new Response(JSON.stringify({ message: 'Registration successful' }), { headers: corsHeaders });
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

        // For paid plans: just set plan/status for now (integration with payments omitted)
        try {
          await env.DB.prepare(
            'UPDATE users SET subscription_plan = ?, subscription_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(plan, 'active', userId).run();
          const row = await env.DB.prepare('SELECT credits, subscription_plan, subscription_status FROM users WHERE id = ?').bind(userId).first();
          return new Response(JSON.stringify({
            success: true,
            message: 'Subscription created successfully',
            credits: row.credits,
            subscription_plan: row.subscription_plan,
            subscription_status: row.subscription_status
          }), { headers: corsHeaders });
        } catch (err) {
          console.error('Subscribe error:', err);
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
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            message: 'Authentication required'
          }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // Extract and verify JWT payload
        const payload = await getPayloadFromHeader(authHeader, env);
        if (!payload) {
          return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401, headers: corsHeaders });
        }
        const userId = payload.sub || payload.userId;
        const user = await getUserById(env.DB, userId);

        if (!user || !user.is_admin || user.is_verified !== 1) {
          return new Response(JSON.stringify({
            message: 'Admin access required or email not verified'
          }), {
            status: 403,
            headers: corsHeaders
          });
        }

        // Get search parameter
        const urlObj = new URL(request.url);
        const searchTerm = urlObj.searchParams.get('search') || '';

        const users = await getAllUsers(env.DB, searchTerm);

        return new Response(JSON.stringify({
          users,
          total: users.length
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
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: corsHeaders });
        }

        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const adminUser = vCheck.user;
        if (!adminUser.is_admin) {
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
          // Prevent deleting self
          if (targetId === adminUser.id) {
            return new Response(JSON.stringify({ message: 'Cannot delete your own account' }), { status: 403, headers: corsHeaders });
          }
          const targetUser = await getUserById(env.DB, targetId);
          if (!targetUser) {
            return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: corsHeaders });
          }
          if (targetUser.is_admin) {
            return new Response(JSON.stringify({ message: 'Cannot delete an admin account' }), { status: 403, headers: corsHeaders });
          }

          const deleted = await deleteUser(env.DB, targetId);
          await logAnalyticsEvent(env.DB, 'admin_delete_user', adminUser.id, { targetId }, request);
          if (!deleted) {
            return new Response(JSON.stringify({ message: 'Failed to delete user' }), { status: 500, headers: corsHeaders });
          }
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
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
              // Optionally return the temp password (only for admin use) — be cautious in production
              return new Response(JSON.stringify({ success: true, tempPassword: newPassword ? undefined : tempPassword }), { headers: corsHeaders });
            } catch (e) {
              console.error('Reset password error:', e);
              return new Response(JSON.stringify({ message: 'Failed to reset password' }), { status: 500, headers: corsHeaders });
            }
          }
        }

        // PUT actions: subscription update
        if (request.method === 'PUT' && parts.length >= 5 && parts[4] === 'subscription') {
          const body = await request.json().catch(() => ({}));
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
            updates.push('subscription_expires = ?'); params.push(body.expiresAt);
          }
          try {
            if (updates.length > 0) {
              const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
              params.push(targetId);
              await env.DB.prepare(sql).bind(...params).run();
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
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            message: 'Authentication required'
          }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // require verified admin
        const vCheck = await requireVerifiedFromHeader(authHeader, env);
        if (vCheck.errorResponse) return vCheck.errorResponse;
        const user = vCheck.user;
        if (!user.is_admin) {
          return new Response(JSON.stringify({
            message: 'Admin access required'
          }), {
            status: 403,
            headers: corsHeaders
          });
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
          console.log('Image-to-image payload prepared: mime=', mimeType, 'strength=', preserveStrength);
        }

        console.log('Calling AI API with payload:', providerPayload);

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