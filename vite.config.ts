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
        // Conservative fallback: group all node_modules into single vendor.react chunk.
        // This avoids runtime ordering issues where a chunk that depends on React loads
        // before the chunk that provides React (createContext undefined).
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            return "vendor.react";
          }

          if (id.includes("/src/services/")) return "app.services";
          if (id.includes("/src/components/")) return "app.components";
          if (id.includes("/src/pages/")) return "app.pages";
        },
      },
    },
  },
}));
