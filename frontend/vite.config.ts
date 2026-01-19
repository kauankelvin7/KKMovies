import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Otimizações do React
      babel: {
        plugins: [
          // Plugins babel aqui, se necessário
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Otimizações de build para Core Web Vitals
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Múltiplas passagens de otimização
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: true, // Compatibilidade Safari
      },
    },
    // Code splitting otimizado para cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks separados para melhor cache de longo prazo
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
        // Nomes consistentes para cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
    // Preload para recursos críticos
    modulePreload: {
      polyfill: true,
    },
  },
  // Otimizações de servidor dev
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Otimizações de pré-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    exclude: [],
  },
  // Performance hints
  preview: {
    port: 3000,
  },
})
