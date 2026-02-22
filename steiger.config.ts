import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.vue'],
  },
  {
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
  {
    files: ['./src/shared/types/**'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
  {
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
])
