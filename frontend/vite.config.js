import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    minify: "esbuild",
    chunkSizeWarningLimit: 600,
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter((dep) => !dep.includes("framer") && !dep.includes("swal"));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("axios")) {
              return "vendor-network";
            }
            if (id.includes("sweetalert2")) {
              return "vendor-swal";
            }
            if (id.includes("zustand") || id.includes("react-hot-toast")) {
              return "vendor-utils";
            }
          }
        },
      },
    },
  },
});
