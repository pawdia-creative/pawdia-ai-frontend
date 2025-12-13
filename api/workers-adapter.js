import { Router } from 'itty-router';

// Adapter to convert Express-style routes to Workers format
export class WorkersRouterAdapter {
  constructor() {
    console.log('Creating WorkersRouterAdapter instance');
    this.router = Router();
    console.log('Router created:', this.router);
    this.setupCORS();
    console.log('CORS setup completed');
  }

  setupCORS() {
    // Handle CORS preflight requests
    this.router.options('*', (request) => {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return new Response(null, { headers, status: 204 });
    });
    
    // Set CORS headers for all requests (but don't return early)
    this.router.all('*', (request) => {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Store CORS headers but don't return early - let other routes handle the request
      request.corsHeaders = headers;
      
      // Don't return anything - let other routes continue
      return undefined;
    });
  }

  // Convert Express route to Workers format
  convertExpressRoute(expressHandler) {
    return async (request, env, ctx) => {
      try {
        // Parse request body
        let body = null;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          try {
            body = await request.json();
          } catch (e) {
            body = {};
          }
        }

        // Extract URL parameters and path
        const url = new URL(request.url);
        const params = Object.fromEntries(url.searchParams);
        
        // Extract the path part correctly
        const fullPath = url.pathname;
        let expressPath = fullPath;
        
        // If the full path starts with /api/admin/, remove that prefix for Express-style routing
        if (fullPath.startsWith('/api/admin/')) {
          expressPath = fullPath.substring('/api/admin'.length) || '/';
        }

        // Create mock req/res objects
        const req = {
          method: request.method,
          headers: Object.fromEntries(request.headers),
          body: body,
          url: fullPath,
          path: expressPath,
          params: { ...params, ...request.params },
          query: params,
          user: request.user || null,
          env: env
        };

        console.log('Converted express route request:', {
          originalUrl: request.url,
          fullPath,
          expressPath,
          method: request.method,
          reqPath: req.path
        });

        let statusCode = 200;
        let responseData = null;
        let responseHeaders = request.corsHeaders || new Headers();

        // Create mock res object
        const res = {
          status: (code) => {
            statusCode = code;
            return res;
          },
          json: (data) => {
            responseData = JSON.stringify(data);
            responseHeaders.set('Content-Type', 'application/json');
            return new Response(responseData, { 
              status: statusCode, 
              headers: responseHeaders 
            });
          },
          send: (data) => {
            responseData = typeof data === 'string' ? data : JSON.stringify(data);
            if (typeof data === 'object') {
              responseHeaders.set('Content-Type', 'application/json');
            }
            return new Response(responseData, { 
              status: statusCode, 
              headers: responseHeaders 
            });
          }
        };

        // Call the Express handler
        console.log('About to call expressHandler...');
        const result = await expressHandler(req, res);
        console.log('Express handler completed successfully');
        
        // If handler returned a Response, return it
        if (result instanceof Response) {
          console.log('Handler returned Response object');
          return result;
        }
        
        // Otherwise, create response from mock res
        if (responseData) {
          console.log('Returning response from mock res');
          return new Response(responseData, { 
            status: statusCode, 
            headers: responseHeaders 
          });
        }
        
        // Default response
        console.log('Returning default success response');
        return new Response(JSON.stringify({ message: 'Success' }), { 
          status: statusCode, 
          headers: responseHeaders 
        });
        
      } catch (error) {
        console.error('Route handler error:', error);
        return new Response(JSON.stringify({ 
          message: 'Internal server error',
          error: error.message 
        }), { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...Object.fromEntries(request.corsHeaders || new Headers())
          }
        });
      }
    };
  }

  // Route registration methods
  get(path, handler) {
    console.log('Registering GET route:', path);
    this.router.get(path, this.convertExpressRoute(handler));
    return this;
  }

  post(path, handler) {
    console.log('Registering POST route:', path);
    this.router.post(path, this.convertExpressRoute(handler));
    return this;
  }

  put(path, handler) {
    console.log('Registering PUT route:', path);
    this.router.put(path, this.convertExpressRoute(handler));
    return this;
  }

  delete(path, handler) {
    console.log('Registering DELETE route:', path);
    this.router.delete(path, this.convertExpressRoute(handler));
    return this;
  }

  all(path, handler) {
    console.log('Registering ALL route:', path);
    this.router.all(path, this.convertExpressRoute(handler));
    return this;
  }

  // Get the final handler
  get handle() {
    return async (request, env, ctx) => {
      const url = new URL(request.url);
      console.log('WorkersRouterAdapter.handle called:', {
        url: request.url,
        pathname: url.pathname,
        method: request.method
      });
      
      // Log the current router routes for debugging
      console.log('Available routes in router:', JSON.stringify(this.router._routes || 'No routes found'));
      
      try {
        const result = await this.router.handle(request, env, ctx);
        console.log('Router handle completed successfully');
        return result;
      } catch (error) {
        console.error('Router handle error:', error);
        throw error;
      }
    };
  }
}

// Export a function to create adapter instances
export function createWorkersRouter() {
  console.log('createWorkersRouter called...');
  console.log('Creating WorkersRouterAdapter...');
  const adapter = new WorkersRouterAdapter();
  console.log('WorkersRouterAdapter created:', adapter);
  return adapter;
}