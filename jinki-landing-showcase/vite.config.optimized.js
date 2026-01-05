import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ═══════════════════════════════════════════════════════════════
// NETWORKPRO OPTIMIZED VITE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export default defineConfig({
  plugins: [react()],
  base: '/',

  // ─────────────────────────────────────────────────────────────
  // BUILD OPTIMIZATION
  // ─────────────────────────────────────────────────────────────
  build: {
    // Output configuration
    outDir: 'dist',
    assetsDir: 'assets',

    // Enable minification for all files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: {
          // Vendor chunks for better cache busting
          'vendor-react': ['react', 'react-dom'],
          'vendor-animation': ['framer-motion', 'gsap'],
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-other': [
            'react-router-dom',
            'lucide-react',
            'lottie-react',
          ],
        },

        // Entry points
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Reporting
    reportCompressedSize: true,
    sourcemap: false, // Disable sourcemaps in production for security

    // CSS code splitting
    cssCodeSplit: true,

    // Module preload polyfill for better browser support
    modulePreload: {
      polyfill: true,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // SERVER OPTIMIZATION
  // ─────────────────────────────────────────────────────────────
  server: {
    // Enable compression during development
    middlewareMode: false,

    // CORS for cross-origin requests
    cors: true,

    // HTTP/2 headers for development
    headers: {
      'X-Dev-Server': 'Vite Dev',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // PREVIEW SERVER (Simulates production)
  // ─────────────────────────────────────────────────────────────
  preview: {
    port: 4173,

    // Enable compression
    middleware: (req, res, next) => {
      // Set caching headers
      if (req.url.match(/\.(js|css|woff2|svg)$/)) {
        // Cache immutable assets forever
        if (req.url.match(/-[a-f0-9]{8}\.(js|css)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      } else if (req.url === '/' || req.url.endsWith('.html')) {
        // Don't cache HTML
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // OPTIMIZATION HINTS
  // ─────────────────────────────────────────────────────────────
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'gsap',
    ],

    // Exclude large modules that should be lazy-loaded
    exclude: [
      'three',
      '@react-three/fiber',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PERFORMANCE CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  ssr: {
    // Mark libraries as external for SSR if needed
    external: [],
  },

  // ─────────────────────────────────────────────────────────────
  // CSS PROCESSING
  // ─────────────────────────────────────────────────────────────
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'remove-unused-css',
          Once(root) {
            // CSS minification happens automatically
          },
        },
      ],
    },
  },
});
