import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Add Sentry plugin for production builds
  if (mode === 'production' && process.env.VITE_SENTRY_DSN) {
    plugins.push(
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      })
    );
  }

  return {
    // Skip env file loading due to permission issues in sandbox
    envDir: false,
    server: {
      host: "localhost",
      port: 3001,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Enable sourcemaps for Sentry error tracking
      sourcemap: mode === 'production',
      // Temporarily disable code splitting to fix React forwardRef issue
      rollupOptions: {
        output: {
          manualChunks: undefined, // Disable manual chunking
        },
      },
    },
  };
});
