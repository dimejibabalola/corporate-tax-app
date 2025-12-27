import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  define: {
    // Inject build timestamp for cache busting
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(Date.now().toString()),
  },
  server: {
    host: "::",
    port: 5180, // Dedicated port for Corporate Tax I
    strictPort: true, // Fail if port is in use instead of incrementing
    hmr: {
      overlay: true, // Show errors as overlay in browser
    },
    watch: {
      usePolling: true, // Better file watching compatibility
      interval: 1000, // Check for changes every second
    },
    headers: {
      'Cache-Control': 'no-store', // Prevent caching in dev
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Unique hashes for every build - prevents stale cache
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
      },
    },
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
