import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    ignores: [
      '**/dist/**',
      '**/out-tsc/**',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      'node_modules/**',
      '.agents/**',
      '.skills/**',
      '**/.wrangler/**',
      'coverage/**',
      'REVIEW_REPORT.md',
      '**/*.ts',
      '**/*.tsx',
    ],
  },
  {
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
];
