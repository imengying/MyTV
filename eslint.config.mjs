import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const sortGroups = [
  ['^@?\\w', '^\\u0000'],
  ['^.+\\.s?css$'],
  ['^@/lib', '^@/hooks'],
  ['^@/data'],
  ['^@/components', '^@/container'],
  ['^@/store'],
  ['^@/'],
  [
    '^\\./?$',
    '^\\.(?!/?$)',
    '^\\.\\./?$',
    '^\\.\\.(?!/?$)',
    '^\\.\\./\\.\\./?$',
    '^\\.\\./\\.\\.(?!/?$)',
    '^\\.\\./\\.\\./\\.\\./?$',
    '^\\.\\./\\.\\./\\.\\.(?!/?$)',
  ],
  ['^@/types'],
  ['^'],
];

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      '.git/**',
      '.next/**',
      'node_modules/**',
      'public/sw.js',
      'public/workbox-*.js',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-unused-vars': 'off',
      'no-console': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-anonymous-default-export': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react/jsx-curly-brace-presence': [
        'warn',
        { props: 'never', children: 'never' },
      ],
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/exports': 'warn',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: sortGroups,
        },
      ],
    },
  },
];
