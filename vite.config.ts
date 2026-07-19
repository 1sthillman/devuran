import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
    historyApiFallback: true, // ✅ SPA routing için
  },
  preview: {
    port: 4173,
    historyApiFallback: true, // ✅ Preview için de
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // ❌ Source map KAPALI - kaynak kodlar görünmez
    minify: 'esbuild', // ✅ esbuild kullan - terser değil (console drop kontrolü için)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // ✅ CRITICAL: Console logları AÇIK - debug için
    drop: [], // Hiçbir şeyi drop etme
    pure: [], // Hiçbir fonksiyonu pure olarak işaretleme
  },
});
