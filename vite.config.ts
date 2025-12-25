import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor.react';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('@radix-ui') || id.includes('tailwindcss')) {
              return 'vendor.ui';
            }
            // Form and validation
            if (id.includes('zod') || id.includes('react-hook-form')) {
              return 'vendor.forms';
            }
            // HTTP and utilities
            if (id.includes('axios') || id.includes('lodash') || id.includes('date-fns')) {
              return 'vendor.utils';
            }
            // Other node_modules
            return 'vendor';
          }
          // Application chunks
          if (id.includes('/src/services/')) {
            return 'app.services';
          }
          if (id.includes('/src/components/')) {
            return 'app.components';
          }
          if (id.includes('/src/pages/')) {
            return 'app.pages';
          }
        },
      },
    },
  },
}));
