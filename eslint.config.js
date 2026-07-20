import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 🔇 Production'da console.log kullanmayı engelle
      // Development'ta warning, production build'de hata
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // TypeScript any kullanımını azaltmak için warning
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
