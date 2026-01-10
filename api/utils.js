// Utility functions for Pawdia AI API

// CORS helper - allowlist controlled by env.ALLOWED_ORIGINS (comma-separated)
export function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  // default allow production domain and Pages preview if none provided
  if (list.length === 0) {
    return [
      'https://pawdia-ai.com',
      'https://www.pawdia-ai.com',
      'https://pawdia-ai-frontend.pages.dev',
      'https://25001b6c.pawdia-ai-frontend.pages.dev',
      'http://localhost:5173'
    ];
  }
  return list;
}

export function makeCorsHeaders(origin, env) {
  const allowed = parseAllowedOrigins(env);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  } else {
    // no allow-origin header when origin not allowed
  }
  return headers;
}

// Produce HTML responses with conservative caching for HTML pages
export function makeHtmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

// Rate limiting helper (simple in-memory store for Workers)
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `${identifier}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { requests: [], resetTime: now + windowMs });
  }

  const limit = rateLimitStore.get(key);

  // Clean up expired requests
  limit.requests = limit.requests.filter(time => time > now - windowMs);

  if (limit.requests.length >= maxRequests) {
    return { allowed: false, resetTime: limit.resetTime };
  }

  limit.requests.push(now);
  return { allowed: true };
}

/**
 * Persistent rate limit using D1 (best-effort).
 * Returns { allowed: boolean, resetTime?: number }
 */
export async function checkRateLimitPersistent(db, identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  if (!db) {
    // No DB available, fall back to in-memory
    return checkRateLimit(identifier, maxRequests, windowMs);
  }

  try {
    const seconds = Math.floor(windowMs / 1000);
    // Count recent events
    const row = await db.prepare('SELECT COUNT(*) as count FROM rate_limits WHERE identifier = ? AND created_at >= datetime(\'now\', ?)').bind(identifier, `-${seconds} seconds`).first();
    const count = row?.count ?? 0;
    if (count >= maxRequests) {
      const oldestRow = await db.prepare('SELECT MIN(created_at) as oldest FROM rate_limits WHERE identifier = ? AND created_at >= datetime(\'now\', ?)').bind(identifier, `-${seconds} seconds`).first();
      const oldestStr = oldestRow?.oldest;
      const oldestTs = oldestStr ? new Date(oldestStr).getTime() : Date.now();
      const resetTime = oldestTs + windowMs;
      return { allowed: false, resetTime };
    }

    // Insert event
    await db.prepare('INSERT INTO rate_limits (identifier) VALUES (?)').bind(identifier).run();
    return { allowed: true };
  } catch (err) {
    console.warn('Persistent rate limit check failed, falling back to in-memory:', err);
    return checkRateLimit(identifier, maxRequests, windowMs);
  }
}

/**
 * Upsert-based counter limiter (fixed window) using D1.
 * Behavior:
 *  - If counter exists and window_end > now: increment count and allow if count <= maxRequests.
 *  - Otherwise reset count to 1 and set window_end = now + windowMs.
 * Returns { allowed: boolean, resetTime?: number, remaining?: number }
 */
export async function checkRateLimitUpsert(db, identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  if (!db) {
    return checkRateLimit(identifier, maxRequests, windowMs);
  }

  try {
    const now = Date.now();
    const row = await db.prepare('SELECT count, window_end FROM rate_counters WHERE identifier = ?').bind(identifier).first();
    if (row) {
      const count = Number(row.count || 0);
      const windowEnd = Number(row.window_end || 0);
      if (windowEnd > now) {
        if (count >= maxRequests) {
          return { allowed: false, resetTime: windowEnd };
        }
        // increment
        await db.prepare('UPDATE rate_counters SET count = count + 1 WHERE identifier = ?').bind(identifier).run();
        return { allowed: true, remaining: Math.max(0, maxRequests - (count + 1)), resetTime: windowEnd };
      } else {
        // window expired - reset to 1 and set new window_end
        const newWindowEnd = now + windowMs;
        await db.prepare('UPDATE rate_counters SET count = 1, window_end = ? WHERE identifier = ?').bind(newWindowEnd, identifier).run();
        return { allowed: true, remaining: maxRequests - 1, resetTime: newWindowEnd };
      }
    } else {
      // insert new row
      const newWindowEnd = Date.now() + windowMs;
      await db.prepare('INSERT INTO rate_counters (identifier, count, window_end) VALUES (?, ?, ?)').bind(identifier, 1, newWindowEnd).run();
      return { allowed: true, remaining: maxRequests - 1, resetTime: newWindowEnd };
    }
  } catch (err) {
    console.warn('Upsert rate limit failed, falling back to in-memory:', err);
    return checkRateLimit(identifier, maxRequests, windowMs);
  }
}

// Generate verification token
export function generateVerificationToken() {
  return crypto.randomUUID();
}

// Generate temporary password
export function generateTempPassword() {
  return 'tmp-' + Math.random().toString(36).slice(2, 10);
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

// Log analytics event helper
export async function logAnalyticsEvent(db, eventType, userId, data = {}, request = null) {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (request) {
      ipAddress = request.headers.get('CF-Connecting-IP') ||
                 request.headers.get('X-Forwarded-For') ||
                 request.headers.get('X-Real-IP');
      userAgent = request.headers.get('User-Agent');
    }

    await db.prepare(
      'INSERT INTO analytics (event_type, user_id, data, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(eventType, userId, JSON.stringify(data), ipAddress, userAgent).run();
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
  }
}
