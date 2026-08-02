// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * Flat ESLint config for the NestJS API (ESLint 9+ format). Uses the
 * (non-type-checked) typescript-eslint recommended set — fast, and enough to
 * catch real problems without requiring the full type-aware program.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Decorator-heavy Nest code legitimately uses `any`/loose casts at the
      // framework boundary; keep this as guidance, not an error.
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow intentionally-unused names when prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          // `const { omitMe, ...rest } = obj` legitimately discards siblings.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);
