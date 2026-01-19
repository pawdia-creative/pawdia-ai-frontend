import React from 'react';

// Helper to lazily import a module with retry on failure (useful for transient chunk/network errors)
export function lazyWithRetry(factory: () => Promise<any>, retries = 2, delayMs = 500) {
  return React.lazy(() => {
    let attempts = 0;
    const run = (): Promise<any> => {
      return factory().catch((err) => {
        if (attempts < retries) {
          attempts += 1;
          if (typeof window !== 'undefined' && (window as any).console) {
            console.warn(`[lazyWithRetry] import failed (attempt ${attempts}), retrying in ${delayMs}ms`, err);
          }
          return new Promise((resolve) => setTimeout(resolve, delayMs)).then(run);
        }
        // Final failure - rethrow so React.lazy triggers an error boundary
        throw err;
      });
    };
    return run();
  });
}


