import { Router } from 'itty-router';

// Adapter to convert Express-style routes to Workers format
export class WorkersRouterAdapter {
  constructor() {
    this.router = Router();
    this.setupCORS();
  }

  setupCORS() {
    this.router.all('*', (request) => {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers, status: 204 });
      }
      
      request.corsHeaders = headers;
      return null;
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

        // Extract URL parameters
        const url = new URL(request.url);
        const params = Object.fromEntries(url.searchParams);

        // Create mock req/res objects
        const req = {
          method: request.method,
          headers: Object.fromEntries(request.headers),
          body: body,
          params: { ...params, ...request.params },
          query: params,
          user: request.user || null,
          env: env
        };

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
        const result = await expressHandler(req, res);
        
        // If handler returned a Response, return it
        if (result instanceof Response) {
          return result;
        }
        
        // Otherwise, create response from mock res
        if (responseData) {
          return new Response(responseData, { 
            status: statusCode, 
            headers: responseHeaders 
          });
        }
        
        // Default response
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
    this.router.get(path, this.convertExpressRoute(handler));
    return this;
  }

  post(path, handler) {
    this.router.post(path, this.convertExpressRoute(handler));
    return this;
  }

  put(path, handler) {
    this.router.put(path, this.convertExpressRoute(handler));
    return this;
  }

  delete(path, handler) {
    this.router.delete(path, this.convertExpressRoute(handler));
    return this;
  }

  all(path, handler) {
    this.router.all(path, this.convertExpressRoute(handler));
    return this;
  }

  // Get the final handler
  get handle() {
    return this.router.handle;
  }
}

// Export a function to create adapter instances
export function createWorkersRouter() {
  return new WorkersRouterAdapter();
}