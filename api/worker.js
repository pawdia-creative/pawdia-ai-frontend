import { Router } from 'itty-router';
import authRoutes from './routes/auth-workers.js';
// import userRoutes from './routes/users-workers.js';
// import uploadRoutes from './routes/upload-workers.js';
// import paymentRoutes from './routes/payments-workers.js';
// import subscriptionRoutes from './routes/subscriptions-workers.js';
// import adminRoutes from './routes/admin-workers.js';

// Create router
const router = Router();

// Health check endpoint
router.get('/api/health', (request, env) => {
  return new Response(JSON.stringify({
    status: 'OK',
    message: 'Pawdia AI API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
});

// Mount API routes
router.all('/api/auth*', (request, env, ctx) => {
  return authRoutes.handle(request, env, ctx);
});
// router.all('/api/users/*', userRoutes.handle);
// router.all('/api/upload/*', uploadRoutes.handle);
// router.all('/api/payments/*', paymentRoutes.handle);
// router.all('/api/subscriptions/*', subscriptionRoutes.handle);
// router.all('/api/admin/*', adminRoutes.handle);

// 404 handler
router.all('*', (request) => {
  return new Response(JSON.stringify({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: request.url.pathname
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Make environment available globally
      globalThis.env = env;
      
      // Handle the request
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error);
    }
  }
};