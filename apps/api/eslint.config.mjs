import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * ESLint flat config for the API.
 *
 * Uses the (non-type-checked) typescript-eslint recommended set — fast, no
 * project-service wiring needed for a scaffold. Type-aware rules can be layered
 * in later. `dist` is ignored. Node globals are enabled.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'drizzle/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
);
