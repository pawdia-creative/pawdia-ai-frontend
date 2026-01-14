import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Types for Sentry API
type SentryAPI = {
  replayIntegration?: (config: { maskAllText: boolean; blockAllMedia: boolean }) => void;
  captureException?: (error: unknown) => void;
};

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
          // Call replay integration if available
          (Sentry as SentryAPI).replayIntegration?.({
            maskAllText: true,
            blockAllMedia: true,
          });
        } catch (e) {
          // ignore
        }
      };

      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback(initReplay, { timeout: 2000 });
      } else {
        setTimeout(initReplay, 3000);
      }
    } catch (e) {
      // ignore init errors
    }
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback(initSentry, { timeout: 1000 });
  } else {
    setTimeout(initSentry, 1500);
  }
}

// Global handler to surface unhandled promise rejections during login flows
window.addEventListener('unhandledrejection', (event) => {
  // Log to console for immediate debugging
  console.error('Unhandled promise rejection captured:', event.reason, event);
  // Also send to Sentry if initialized
  try {
    // Call captureException if available
    (Sentry as SentryAPI).captureException?.(event.reason);
  } catch (e) {
    // ignore
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker during idle to enable precaching of key assets
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerSW = async () => {
    try {
      // Fetch the service worker script first to ensure it's served as JS
      const resp = await fetch('/sw.js', { cache: 'no-store' });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        console.warn('sw.js fetch failed, skipping registration', resp.status);
        return;
      }
      if (!contentType.includes('javascript') && !contentType.includes('x-javascript')) {
        console.warn('sw.js served with wrong Content-Type, skipping registration', contentType);
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      // ignore registration failures but surface in console
      console.warn('Service worker registration failed', e);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback(() => {
      registerSW();
    }, { timeout: 3000 });
  } else {
    setTimeout(registerSW, 5000);
  }
}
