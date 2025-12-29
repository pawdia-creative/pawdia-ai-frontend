import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 600, // Increase from default 500KB
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // React core libraries
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react-core";
          }

          // React ecosystem (React Router, Query, etc.)
          if (id.includes("node_modules/react-router") ||
              id.includes("node_modules/@tanstack/react-query") ||
              id.includes("node_modules/react-hook-form")) {
            return "vendor-react-ecosystem";
          }

          // UI libraries (Radix UI, Lucide, etc.)
          if (id.includes("node_modules/@radix-ui") ||
              id.includes("node_modules/lucide-react") ||
              id.includes("node_modules/class-variance-authority") ||
              id.includes("node_modules/clsx") ||
              id.includes("node_modules/tailwind-merge")) {
            return "vendor-ui";
          }

          // Utility libraries
          if (id.includes("node_modules/date-fns") ||
              id.includes("node_modules/zod") ||
              id.includes("node_modules/cmdk")) {
            return "vendor-utils";
          }

          // Payment libraries
          if (id.includes("node_modules/@paypal") ||
              id.includes("node_modules/@stripe")) {
            return "vendor-payments";
          }

          // Other node_modules
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }

          // Application chunks
          if (id.includes("/src/services/")) return "app-services";
          if (id.includes("/src/components/")) return "app-components";
          if (id.includes("/src/pages/")) return "app-pages";
          if (id.includes("/src/hooks/") || id.includes("/src/lib/")) return "app-utils";
        },
      },
    },
  },
}));
