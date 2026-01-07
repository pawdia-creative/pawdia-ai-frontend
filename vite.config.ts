import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Disable env file loading to avoid permission issues
  envFile: false,
  server: {
    host: "localhost",
    port: 3001,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Temporarily disable code splitting to fix React forwardRef issue
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking
      },
    },
  },
}));
