import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createWorkersRouter } from '../workers-adapter.js';

console.log('Simple admin routes module loading...');

// Create router
console.log('Creating simple admin router...');
const router = createWorkersRouter();
console.log('Simple admin router created:', router);

// Simple database query helper for Cloudflare Workers
async function queryDatabase(env, sql, params = []) {
  try {
    const db = env.DB;
    const stmt = db.prepare(sql);
    
    if (params.length > 0) {
      return stmt.all(...params);
    } else {
      return stmt.all();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Simple JWT verification
async function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization token required', status: 401 };
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = globalThis.env?.JWT_SECRET || process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return { error: 'Server configuration error: JWT_SECRET not set', status: 500 };
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.isAdmin) {
      return { error: 'Access denied. Admin privileges required.', status: 403 };
    }

    return { user: decoded };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { error: 'Authentication error', status: 500 };
  }
}

// Test route
router.get('/test', async (request) => {
  console.log('Simple admin test route called!', {
    url: request.url,
    path: request.path,
    method: request.method
  });
  
  return new Response(JSON.stringify({ 
    message: 'Simple admin routes working!',
    url: request.url,
    path: request.path,
    method: request.method
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// Get all users (admin only)
router.get('/users', async (request, env) => {
  console.log('Simple admin users route called!', {
    method: request.method,
    path: request.path,
    url: request.url
  });
  
  try {
    // Check admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
      return new Response(JSON.stringify({ message: authResult.error }), {
        status: authResult.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get users from database
    const users = await queryDatabase(env, 'SELECT id, name, email, avatar, credits, is_verified, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC');
    
    console.log('Found users:', users.length);

    return new Response(JSON.stringify({
      users,
      total: users.length,
      message: 'Users retrieved successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({ 
      message: 'Error fetching users',
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

export default router;