import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry for error monitoring
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
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
