import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import d1Database from './config/d1-database.js';
import authRoutes from './routes/auth-workers.js';
import adminRoutes from './routes/admin-workers.js';
import subscriptionRoutes from './routes/subscriptions-workers.js';
import paymentRoutes from './routes/payments-workers.js';
import analyticsRoutes from './routes/analytics-workers.js';
import Analytics from './models/D1Analytics.js';
// import userRoutes from './routes/users-workers.js';
// import uploadRoutes from './routes/upload-workers.js';

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
router.options('*', (request, env, ctx) => {
  console.log('[WORKER] OPTIONS preflight request:', request.url);
  return new Response(null, { 
    headers: corsHeaders, 
    status: 204 
  });
});

// Simple test endpoint
router.get('/api/test', (request, env, ctx) => {
  console.log('[WORKER] Simple test route called!', request.url);
  return new Response(JSON.stringify({
    message: 'Simple test working!',
    url: request.url
  }), {
    headers: corsHeaders // Use defined corsHeaders
  });
});

// Contact form endpoint - accepts POST with { name, email, phone, message }
router.post('/api/contact', async (request, env, ctx) => {
  try {
    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.json().catch(() => ({})) : {};
    const { name, email, phone, message } = body || {};
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ message: 'Missing required fields: name, email, message' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Lazy import to avoid circular issues
    const { sendContactEmail } = await import('./services/emailService.js');
    const sent = await sendContactEmail({ name, email, phone, message });
    if (!sent) {
      return new Response(JSON.stringify({ message: 'Failed to send contact email' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ message: 'Contact message sent' }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[WORKER] Contact endpoint error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
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
router.all('/api/auth/*', async (request, env, ctx) => {
  console.log('[DEBUG] worker.js: Auth route called:', request.url, 'method:', request.method);
  
  // IMPORTANT: Create a new Request object with the /api/auth prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/auth', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/'; // Ensure a valid root path for the sub-router
  }

  // IMPORTANT: Request body can only be read once, so we need to clone the request
  // or parse the body first and pass it separately
  // For POST/PUT requests, we need to preserve the body
  let requestBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      // Clone the request to read the body without consuming the original
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
      console.log('[DEBUG] worker.js: Parsed request body:', JSON.stringify(requestBody));
      console.log('[DEBUG] worker.js: Request body type:', typeof requestBody);
      console.log('[DEBUG] worker.js: Request body keys:', Object.keys(requestBody || {}));
    } catch (e) {
      console.error('[DEBUG] worker.js: Error parsing request body:', e);
      console.error('[DEBUG] worker.js: Error stack:', e.stack);
      requestBody = {};
    }
  }

  // Create a new Request object with the modified URL and body
  // Since we've already parsed the body, we need to stringify it for the new Request
  const bodyString = requestBody ? JSON.stringify(requestBody) : null;
  console.log('[DEBUG] worker.js: Body string for new Request:', bodyString);
  
  // Create new headers with Content-Type if body exists
  const newHeaders = new Headers(request.headers);
  if (bodyString) {
    newHeaders.set('Content-Type', 'application/json');
  }
  
  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: bodyString,
      redirect: request.redirect,
      // ... copy other properties if necessary (e.g., cf, signal, etc.)
  });
  
  console.log('[DEBUG] worker.js: Created modifiedRequest, URL:', modifiedRequest.url, 'method:', modifiedRequest.method);

  // Pass the modified request to the authRoutes handler
  return authRoutes.handle(modifiedRequest, env, ctx);
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

router.all('/api/admin/*', async (request, env, ctx) => {
  console.log('[DEBUG] worker.js: Admin route called:', request.url, 'method:', request.method);
  
  // IMPORTANT: Create a new Request object with the /api/admin prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/admin', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/'; // Ensure a valid root path for the sub-router
  }

  // IMPORTANT: Request body can only be read once, so we need to clone the request
  // or parse the body first and pass it separately
  // For POST/PUT requests, we need to preserve the body
  let requestBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      // Clone the request to read the body without consuming the original
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
      console.log('[DEBUG] worker.js: Parsed admin request body:', JSON.stringify(requestBody));
      console.log('[DEBUG] worker.js: Admin request body type:', typeof requestBody);
      console.log('[DEBUG] worker.js: Admin request body keys:', Object.keys(requestBody || {}));
    } catch (e) {
      console.error('[DEBUG] worker.js: Error parsing admin request body:', e);
      console.error('[DEBUG] worker.js: Error stack:', e.stack);
      requestBody = {};
    }
  }

  // Create a new Request object with the modified URL and body
  // Since we've already parsed the body, we need to stringify it for the new Request
  const bodyString = requestBody ? JSON.stringify(requestBody) : null;
  console.log('[DEBUG] worker.js: Admin body string for new Request:', bodyString);
  
  // Create new headers with Content-Type if body exists
  const newHeaders = new Headers(request.headers);
  if (bodyString) {
    newHeaders.set('Content-Type', 'application/json');
  }
  
  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: bodyString,
      redirect: request.redirect,
      // ... copy other properties if necessary (e.g., cf, signal, etc.)
  });
  
  console.log('[DEBUG] worker.js: Created modified admin request, URL:', modifiedRequest.url, 'method:', modifiedRequest.method);

  // Pass the modified request to the adminRoutes handler
  return adminRoutes.handle(modifiedRequest, env, ctx);
});

router.all('/api/subscriptions/*', async (request, env, ctx) => {
  console.log('[DEBUG] worker.js: Subscription route called:', request.url, 'method:', request.method);

  // IMPORTANT: Create a new Request object with the /api/subscriptions prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/subscriptions', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/'; // Ensure a valid root path for the sub-router
  }

  // IMPORTANT: Request body can only be read once, so we need to clone the request
  // or parse the body first and pass it separately
  // For POST/PUT requests, we need to preserve the body
  let requestBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      // Clone the request to read the body without consuming the original
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
      console.log('[DEBUG] worker.js: Parsed subscription request body:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('[DEBUG] worker.js: Error parsing subscription request body:', e);
      console.error('[DEBUG] worker.js: Error stack:', e.stack);
      requestBody = {};
    }
  }

  // Create a new Request object with the modified URL and body
  const bodyString = requestBody ? JSON.stringify(requestBody) : null;
  
  // Create new headers with Content-Type if body exists
  const newHeaders = new Headers(request.headers);
  if (bodyString) {
    newHeaders.set('Content-Type', 'application/json');
  }

  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: bodyString,
      redirect: request.redirect,
  });

  console.log('[DEBUG] worker.js: Created modified subscription request, URL:', modifiedRequest.url, 'method:', modifiedRequest.method);

  // Pass the modified request to the subscriptionRoutes handler
  return subscriptionRoutes.handle(modifiedRequest, env, ctx);
});

// Payment routes
router.all('/api/payments/*', async (request, env, ctx) => {
  console.log('[DEBUG] worker.js: Payment route called:', request.url, 'method:', request.method);

  // Create a new Request object with the /api/payments prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/payments', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/';
  }

  // Parse request body for POST/PUT requests
  let requestBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
      console.log('[DEBUG] worker.js: Parsed payment request body:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('[DEBUG] worker.js: Error parsing payment request body:', e);
      requestBody = {};
    }
  }

  // Create a new Request object with the modified URL and body
  const bodyString = requestBody ? JSON.stringify(requestBody) : null;
  
  // Create new headers with Content-Type if body exists
  const newHeaders = new Headers(request.headers);
  if (bodyString) {
    newHeaders.set('Content-Type', 'application/json');
  }

  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: bodyString,
      redirect: request.redirect,
  });

  console.log('[DEBUG] worker.js: Created modified payment request, URL:', modifiedRequest.url, 'method:', modifiedRequest.method);

  // Pass the modified request to the paymentRoutes handler
  return paymentRoutes.handle(modifiedRequest, env, ctx);
});

// Analytics routes
router.all('/api/analytics/*', async (request, env, ctx) => {
  console.log('[DEBUG] worker.js: Analytics route called:', request.url, 'method:', request.method);
  
  // Create a new Request object with the /api/analytics prefix removed
  const newUrl = new URL(request.url);
  newUrl.pathname = newUrl.pathname.replace('/api/analytics', '');
  if (newUrl.pathname === '') {
      newUrl.pathname = '/';
  }

  // Parse request body for POST/PUT requests
  let requestBody = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const clonedRequest = request.clone();
      requestBody = await clonedRequest.json();
      console.log('[DEBUG] worker.js: Parsed analytics request body:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('[DEBUG] worker.js: Error parsing analytics request body:', e);
      requestBody = {};
    }
  }

  // Create a new Request object with the modified URL and body
  const bodyString = requestBody ? JSON.stringify(requestBody) : null;
  
  // Create new headers with Content-Type if body exists
  const newHeaders = new Headers(request.headers);
  if (bodyString) {
    newHeaders.set('Content-Type', 'application/json');
  }

  const modifiedRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: bodyString,
      redirect: request.redirect,
  });

  console.log('[DEBUG] worker.js: Created modified analytics request, URL:', modifiedRequest.url, 'method:', modifiedRequest.method);

  // Pass the modified request to the analyticsRoutes handler
  return analyticsRoutes.handle(modifiedRequest, env, ctx);
});

// router.all('/api/users/*', userRoutes.handle);
// router.all('/api/upload/*', uploadRoutes.handle);

// 404 handler
router.all('*', (request, env, ctx) => {
  const url = new URL(request.url);
  console.log('[WORKER] 404 - Route not found:', url.pathname);
  return new Response(JSON.stringify({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: url.pathname
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
      
      // IMPORTANT: Connect to D1 database (only if not already connected)
      // Use ctx.waitUntil to avoid blocking the response
      if (!d1Database.isConnected && env && env.DB) {
        try {
          await d1Database.connect(env);
        } catch (dbError) {
          console.error('[WORKER] D1 database connection error:', dbError);
          // Don't fail the request if DB connection fails - some routes might not need DB
        }
      }
      
      console.log('[WORKER] Fetch called:', request.method, request.url);
      
      // Handle OPTIONS requests immediately (CORS preflight) - before router to avoid any issues
      if (request.method === 'OPTIONS') {
        console.log('[WORKER] Handling OPTIONS preflight request for:', request.url);
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }
      
      // Determine if this is an API call for analytics
      const url = new URL(request.url);
      const isApiCall = url.pathname.startsWith('/api/') && 
                       url.pathname !== '/api/health' && 
                       url.pathname !== '/api/test';
      const startTime = Date.now();
      
      // Handle the request with timeout protection
      let response;
      try {
        const routerPromise = router.handle(request, env, ctx);
        
        // Add timeout protection
        response = await Promise.race([
          routerPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
          )
        ]);
        
        console.log('[WORKER] Router response received:', response ? 'has response' : 'null/undefined');
        
        // Record analytics for API calls (non-blocking)
        if (isApiCall && d1Database.isConnected && ctx) {
          ctx.waitUntil((async () => {
            try {
              // Initialize analytics table if needed (with retry)
              let tableInitialized = false;
              try {
                await Analytics.initTable();
                tableInitialized = true;
              } catch (initError) {
                console.error('[WORKER] Analytics table init error:', initError);
                // Try once more
                try {
                  await Analytics.initTable();
                  tableInitialized = true;
                } catch (retryError) {
                  console.error('[WORKER] Analytics table init retry failed:', retryError);
                  // Continue anyway - table might exist but init failed for other reasons
                }
              }
              
              // Only record if table is initialized or we'll try anyway
              if (tableInitialized || true) {
                // Extract user ID from token if available
                let userId = null;
                const authHeader = request.headers.get('authorization');
                if (authHeader && authHeader.startsWith('Bearer ')) {
                  try {
                    const token = authHeader.substring(7);
                    const JWT_SECRET = env.JWT_SECRET;
                    if (JWT_SECRET) {
                      const decoded = jwt.verify(token, JWT_SECRET);
                      userId = decoded.userId || decoded.id;
                    }
                  } catch (e) {
                    // Token invalid or expired, ignore
                  }
                }
                
                // Get IP address from request
                const ipAddress = request.headers.get('cf-connecting-ip') || 
                                 request.headers.get('x-forwarded-for') || 
                                 'unknown';
                
                // Record the API call
                try {
                  await Analytics.recordEvent({
                    userId: userId,
                    sessionId: request.headers.get('x-session-id') || null,
                    eventType: 'api_call',
                    endpoint: url.pathname,
                    method: request.method,
                    statusCode: response?.status || null,
                    responseTime: Date.now() - startTime,
                    ipAddress: ipAddress,
                    userAgent: request.headers.get('user-agent') || null,
                    referer: request.headers.get('referer') || null
                  });
                } catch (recordError) {
                  // If recording fails due to table not existing, try to create table and retry
                  if (recordError.message && recordError.message.includes('no such table')) {
                    try {
                      await Analytics.initTable();
                      // Retry recording
                      await Analytics.recordEvent({
                        userId: userId,
                        sessionId: request.headers.get('x-session-id') || null,
                        eventType: 'api_call',
                        endpoint: url.pathname,
                        method: request.method,
                        statusCode: response?.status || null,
                        responseTime: Date.now() - startTime,
                        ipAddress: ipAddress,
                        userAgent: request.headers.get('user-agent') || null,
                        referer: request.headers.get('referer') || null
                      });
                    } catch (retryError) {
                      console.error('[WORKER] Analytics record retry failed:', retryError);
                    }
                  } else {
                    console.error('[WORKER] Analytics recording error:', recordError);
                  }
                }
              }
            } catch (analyticsError) {
              console.error('[WORKER] Analytics error:', analyticsError);
              // Don't fail the request if analytics fails
            }
          })());
        }
      } catch (timeoutError) {
        console.error('[WORKER] Request timeout or error:', timeoutError.message);
        const timeoutHeaders = new Headers(corsHeaders);
        return new Response(JSON.stringify({
          error: 'Request Timeout',
          message: 'The request took too long to process. Please try again.',
          details: timeoutError.message
        }), {
          status: 504,
          headers: timeoutHeaders,
        });
      }

      // Check if response is null or undefined
      if (!response) {
        console.error('[WORKER] Router returned null/undefined response for:', request.url);
        const errorHeaders = new Headers(corsHeaders);
        return new Response(JSON.stringify({
          error: 'No Response',
          message: 'The server did not return a response. Please check the route configuration.',
          path: new URL(request.url).pathname
        }), {
          status: 500,
          headers: errorHeaders,
        });
      }
      
      // Ensure response is a Response object
      if (!(response instanceof Response)) {
        console.error('[WORKER] Router returned non-Response object:', typeof response);
        const errorHeaders = new Headers(corsHeaders);
        return new Response(JSON.stringify({
          error: 'Invalid Response',
          message: 'The server returned an invalid response type.',
          type: typeof response
        }), {
          status: 500,
          headers: errorHeaders,
        });
      }

      // IMPORTANT: Add CORS headers to all responses
      const newHeaders = new Headers(response.headers || {});
      newHeaders.set('Access-Control-Allow-Origin', '*'); // Allow all origins
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Return a new Response with updated headers
      return new Response(response.body || JSON.stringify({ error: 'No response body' }), {
        status: response.status || 500,
        statusText: response.statusText || 'Internal Server Error',
        headers: newHeaders,
      });

    } catch (error) {
      console.error('[WORKER] Fetch error:', error);
      console.error('[WORKER] Error stack:', error.stack);
      
      // Return error response with CORS headers
      const errorHeaders = new Headers(corsHeaders);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Something went wrong',
        type: error.name || 'Error'
      }), {
        status: 500,
        headers: errorHeaders,
      });
    }
  }
};