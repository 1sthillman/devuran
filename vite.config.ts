import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    inspectAttr(), 
    react(),
    // Production'da kod karmaşıklaştırma - daha hafif ayarlar
    obfuscatorPlugin({
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
      exclude: [
        /node_modules/,
        /firebase/i, // Firebase dosyalarını karmaşıklaştırma
        /\.(config|setup)\./i, // Config dosyalarını karmaşıklaştırma
      ],
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: false, // Firebase ile uyumsuz - kapat
        deadCodeInjection: false, // Performans sorunu yaratıyor - kapat
        debugProtection: false,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        renameGlobals: false, // Firebase global'lerini korumak için
        selfDefending: false, // Hata yaratabilir - kapat
        simplify: true,
        splitStrings: false, // Firebase string'lerini bozabilir - kapat
        stringArray: true,
        stringArrayThreshold: 0.5, // Daha az agresif
        transformObjectKeys: false, // Firebase obje key'lerini korumak için
        unicodeEscapeSequence: false,
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
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
    drop: ['console', 'debugger'],
  },
});
