export default {
  async fetch(request, env, ctx) {
    try {
      // Proxy the original request to origin (Pages) and strip restrictive headers
      const response = await fetch(request);

      // Read body as ArrayBuffer to preserve binary responses
      const buffer = await response.arrayBuffer();

      // Only strip headers for HTML responses to minimize side-effects
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const headers = new Headers(response.headers);
        headers.delete('Permissions-Policy');
        headers.delete('Feature-Policy');
        // Optionally remove cross-origin embedder/opener policies if needed (use with caution)
        // headers.delete('Cross-Origin-Embedder-Policy');
        // headers.delete('Cross-Origin-Opener-Policy');

        return new Response(buffer, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }

      // Non-HTML responses: return unchanged
      return new Response(buffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (err) {
      return new Response(JSON.stringify({ message: 'Proxy error', detail: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
  }
};


