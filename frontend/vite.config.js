import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-router-dom") ||
              id.includes("react-dom") ||
              id.includes("react")
            ) {
              return "vendor-react";
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            if (id.includes("hls.js")) {
              return "vendor-hls";
            }
            if (id.includes("katex")) {
              return "vendor-katex";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (id.includes("radix-ui") || id.includes("@radix-ui")) {
              return "vendor-radix";
            }
          }
        },
      },
    },
  },
});
