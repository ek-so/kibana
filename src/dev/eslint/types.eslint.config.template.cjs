/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * THIS FILE IS WRITTEN AUTOMATICALLY by `node scripts/eslint_with_types` and
 * should be deleted automatically unless something goes wrong
 */

const config = JSON.parse('{PACKAGE_CONFIG}');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: config.rootDir,
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-exports': 'error',
  },
  overrides: [
    {
      files: ['server/**/*', '*functional*/**/*', '*api_integration*/**/*'],
      rules: {
        // Let's focus on server-side errors first to avoid server crashes.
        // We'll tackle /public eventually.
        '@typescript-eslint/no-floating-promises': 'error',
      },
    },
    {
      files: ['*spaces_api_integration/common/services/basic_auth_supertest.ts'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
};
