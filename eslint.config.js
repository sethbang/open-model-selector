// ESLint flat config (ESLint 9). Focused on correctness, not style — Prettier
// handles formatting, so no stylistic rules here.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'storybook-static/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', localStorage: 'readonly',
                 setTimeout: 'readonly', clearTimeout: 'readonly', console: 'readonly',
                 fetch: 'readonly', AbortController: 'readonly', AbortSignal: 'readonly',
                 DOMException: 'readonly', HTMLElement: 'readonly', HTMLButtonElement: 'readonly',
                 HTMLDivElement: 'readonly', MouseEvent: 'readonly', KeyboardEvent: 'readonly',
                 Event: 'readonly', Node: 'readonly', process: 'readonly' },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Classic react-hooks rules only — the newer React Compiler-style rules
      // (refs/set-state-in-effect/use-memo) are disabled: they flag working code
      // that predates Compiler guarantees and would require a larger refactor.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...jsxA11y.configs.recommended.rules,
      // React 17+ JSX transform — no need to import React in scope.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Unused-vars: allow leading-underscore escape hatch (matches codebase style).
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_', varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-unused-vars': 'off',
      // `any` is used deliberately in a few type-erase spots; warn, don't error.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Combobox search input uses autoFocus by design (W3C combobox pattern:
      // focus the input when the listbox opens so typing filters immediately).
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    // Stories use useState inside `render` which ESLint can't detect as a
    // component — Storybook treats render functions as components at runtime.
    files: ['src/**/*.stories.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    // Tests and stories can use looser rules.
    files: ['src/**/*.{test,stories}.{ts,tsx}', 'vitest.*.ts', '.storybook/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
    },
  },
  prettier,
]
