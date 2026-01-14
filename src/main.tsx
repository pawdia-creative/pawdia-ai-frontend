import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Defer heavy Sentry initialization (tracing & replay) until browser idle to reduce startup cost
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  const initSentry = () => {
    try {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          // Initialize minimal tracing first; full replay/tracing deferred
          Sentry.browserTracingIntegration && Sentry.browserTracingIntegration(),
        ].filter(Boolean),
        tracesSampleRate: 0.1, // lowered default sampling for startup
      });

      // Defer session replay initialization to idle
      const initReplay = () => {
        try {
          if ((Sentry as any).replayIntegration) {
            (Sentry as any).replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            });
          }
        } catch (e) {
          // ignore
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(initReplay, { timeout: 2000 });
      } else {
        setTimeout(initReplay, 3000);
      }
    } catch (e) {
      // ignore init errors
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(initSentry, { timeout: 1000 });
  } else {
    setTimeout(initSentry, 1500);
  }
}

// Global handler to surface unhandled promise rejections during login flows
window.addEventListener('unhandledrejection', (event) => {
  // Log to console for immediate debugging
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection captured:', event.reason, event);
  // Also send to Sentry if initialized
  try {
    if ((Sentry as any).captureException) {
      (Sentry as any).captureException(event.reason);
    }
  } catch (e) {
    // ignore
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker during idle to enable precaching of key assets
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerSW = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      // ignore registration failures
      // eslint-disable-next-line no-console
      console.warn('Service worker registration failed', e);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      registerSW();
    }, { timeout: 3000 });
  } else {
    setTimeout(registerSW, 5000);
  }
}
