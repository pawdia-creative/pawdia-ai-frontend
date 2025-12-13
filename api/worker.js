import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import d1Database from './config/d1-database.js';
import authRoutes from './routes/auth-workers.js';
import adminRoutes from './routes/admin-workers-simple.js';
// import userRoutes from './routes/users-workers.js';
// import uploadRoutes from './routes/upload-workers.js';
// import paymentRoutes from './routes/payments-workers.js';
// import subscriptionRoutes from './routes/subscriptions-workers.js';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Create router
const router = Router();

// Handle CORS preflight for all routes
router.options('*', () => {
  return new Response(null, { headers: corsHeaders, status: 204 });
});

// Simple test endpoint
router.get('/api/test', (request, env) => {
  console.log('Simple test route called!', request.url);
  return new Response(JSON.stringify({
    message: 'Simple test working!',
    url: request.url
  }), {
    headers: corsHeaders // Use defined corsHeaders
  });
});

// Health check endpoint
router.get('/api/health', (request, env) => {
  return new Response(JSON.stringify({
    status: 'OK',
    message: 'Pawdia AI API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production'
  }), {
    headers: corsHeaders // Use defined corsHeaders
  });
});

// Mount API routes
router.all('/api/auth/*', async (request, env, ctx) => { // Added ctx parameter
  console.log('Auth route called:', request.url);
  const url = new URL(request.url);
  
  // Direct login endpoint for testing (this block might be removed in production)
  if (url.pathname === '/api/auth/login') {
    console.log('Direct login route matched!');
    
    try {
      const body = await request.json();
      const { email, password } = body;
      
      console.log('Login attempt for:', email);
      
      // Simple JWT verification without database for now
      if (email === 'admin@pawdia.ai' && password === 'admin123456') {
        const JWT_SECRET = env.JWT_SECRET;
        if (!JWT_SECRET) {
          return new Response(JSON.stringify({ message: 'Server configuration error: JWT_SECRET not set' }), {
            status: 500,
            headers: corsHeaders
          });
        }
        const token = jwt.sign({ 
          userId: '1',
          isAdmin: true,
          email: email
        }, JWT_SECRET, { expiresIn: '7d' });
        
        return new Response(JSON.stringify({
          token,
          user: {
            id: '1',
            email: email,
            name: 'System Administrator',
            isAdmin: true
          }
        }), {
          headers: corsHeaders // Use defined corsHeaders
        });
      } else {
        return new Response(JSON.stringify({ message: 'User does not exist or incorrect password' }), {
          status: 400,
          headers: corsHeaders // Use defined corsHeaders
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({ message: 'Server error' }), {
        status: 500,
        headers: corsHeaders // Use defined corsHeaders
      });
    }
  }
  
  // IMPORTANT: Create a new Request object with the /api/auth prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/auth', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/'; // Ensure a valid root path for the sub-router
  }

  // Create a new Request object with the modified URL
  // The request object is immutable, so we create a new one.
  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body, // Preserve original body
      redirect: request.redirect,
      // ... copy other properties if necessary (e.g., cf, signal, etc.)
  });

  // Pass the modified request to the authRoutes handler
  return authRoutes.handle(modifiedRequest, env, ctx); // Pass ctx here
});

// Direct admin test route without adapter (this block also needs corsHeaders and ctx)
router.get('/api/admin/test', async (request, env) => {
  console.log('Direct admin test route called!', request.url);
  return new Response(JSON.stringify({
    message: 'Direct admin route working!',
    url: request.url,
    method: request.method
  }), {
    headers: corsHeaders // Use defined corsHeaders
  });
});

router.all('/api/admin/*', async (request, env, ctx) => { // Added ctx parameter
  const url = new URL(request.url);
  console.log('Admin route called directly:', request.url, 'pathname:', url.pathname);
  
  // Simple admin users endpoint
  if (url.pathname === '/api/admin/users') {
    console.log('Direct admin users route matched!');
    console.log('Request headers:', JSON.stringify(Object.fromEntries(request.headers)));
    
    try {
      // Simple JWT verification
      const authHeader = request.headers.get('authorization');
      console.log('Auth header:', authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth header or invalid format');
        return new Response(JSON.stringify({ message: 'Authorization token required' }), {
          status: 401,
          headers: corsHeaders // Use defined corsHeaders
        });
      }

      const token = authHeader.substring(7);
      const JWT_SECRET = env.JWT_SECRET;
      console.log('JWT_SECRET available:', !!JWT_SECRET);
      console.log('Token length:', token.length);
      
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully:', { userId: decoded.userId, isAdmin: decoded.isAdmin });
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError.message);
        return new Response(JSON.stringify({ 
          message: 'Invalid token',
          error: jwtError.message 
        }), {
          status: 401,
          headers: corsHeaders // Use defined corsHeaders
        });
      }
      
      if (!decoded.isAdmin) {
        console.log('User is not admin');
        return new Response(JSON.stringify({ message: 'Access denied. Admin privileges required.' }), {
          status: 403,
          headers: corsHeaders // Use defined corsHeaders
        });
      }

      console.log('Admin verification successful, fetching users...');

      // Get users from database
      const db = env.DB;
      const stmt = db.prepare('SELECT id, name, email, avatar, credits, is_verified, is_admin, created_at FROM users ORDER BY created_at DESC');
      const usersResult = await stmt.all();
      
      console.log('Direct admin route - Raw database result:', usersResult);
      const users = usersResult.results || [];
      
      console.log('Direct admin route - Found users:', users.length);

      return new Response(JSON.stringify({
        users,
        total: users.length,
        message: 'Direct admin route working!'
      }), {
        headers: corsHeaders // Use defined corsHeaders
      });
    } catch (error) {
      console.error('Direct admin route error:', error);
      return new Response(JSON.stringify({ 
        message: 'Error fetching users',
        error: error.message 
      }), {
        status: 500,
        headers: corsHeaders // Use defined corsHeaders
      });
    }
  }
  
  // Fallback to adapter
  return adminRoutes.handle(request, env, ctx); // Pass ctx here
});
// router.all('/api/users/*', userRoutes.handle);
// router.all('/api/upload/*', uploadRoutes.handle);
// router.all('/api/payments/*', paymentRoutes.handle);
// router.all('/api/subscriptions/*', subscriptionRoutes.handle);

// 404 handler
router.all('*', (request) => {
  return new Response(JSON.stringify({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: request.url.pathname
  }), {
    status: 404,
    headers: corsHeaders // Use defined corsHeaders
  });
});

// Error handling
const errorHandler = (error) => {
  console.error('Worker Error:', error);
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong'
  }), {
    status: 500,
    headers: corsHeaders // Use defined corsHeaders
  });
};

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Make environment available globally
      globalThis.env = env;
      // IMPORTANT: Connect to D1 database
      await d1Database.connect(env); // <-- 添加这一行
      
      console.log('Worker fetch called:', request.method, request.url, request.url.pathname);
      
      // Handle the request
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker fetch error:', error);
      return errorHandler(error);
    }
  }
};
  }
};