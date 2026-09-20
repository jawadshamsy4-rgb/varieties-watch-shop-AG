import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  define: {
    // Stamp every build with a unique version so client-side cache
    // invalidation can reliably detect new deployments. Falls back to the
    // package.json version in dev where rebuild timestamps are noisy.
    __APP_VERSION__: JSON.stringify(
      `${process.env.npm_package_version ?? "0.0.0"}-${Date.now().toString(36)}`,
    ),
  },
}));
