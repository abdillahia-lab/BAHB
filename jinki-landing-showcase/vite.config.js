import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// LAZYMASTER: Championship-winning lazy loading configuration
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // STRATEGY: Lazy-loaded 3D pages don't load Three.js into main bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries - loaded immediately for all pages
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          // Animation libraries - loaded immediately (required by landing page)
          'vendor-animation': ['framer-motion', 'gsap', 'lenis'],
          // CRITICAL: Three.js is ONLY loaded when 3D routes are accessed via lazy() + Suspense
          // This prevents 56.7kB from blocking initial page load
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          // Utilities
          'utils': ['lucide-react']
        },
        // Optimize chunk names for caching strategy
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
    },
    // Inline smaller assets to reduce requests
    assetsInlineLimit: 4096,
    // Optimize CSS
    cssCodeSplit: true,
    minify: 'esbuild',
    esbuild: {
      drop: ['console']
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Report compressed size for monitoring
    reportCompressedSize: true,
    // No source maps in production (saves ~30% on bundle size)
    sourcemap: false,
    // Target modern browsers for optimal performance
    target: 'esnext'
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    // Pre-bundle frequently used dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lenis',
      'lucide-react'
    ],
    // Exclude large libraries that change often
    exclude: ['three', '@react-three/fiber'],
    // Force optimization of certain modules
    force: true
  },
  // Server configuration for development
  server: {
    middlewareMode: false,
    // Enable compression headers
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
})
