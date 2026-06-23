import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * ESLint flat config for the web app.
 *
 * Next 16's eslint-config-next ships native flat-config arrays, so we spread
 * them directly — the legacy FlatCompat path is broken under modern ESLint.
 * `core-web-vitals` adds the accessibility and performance rules that support
 * the WCAG 2.2 AA goal in 05_COMPLIANCE.md.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
