/**
 * ESLint configuration for Claude Code Mobile
 * @description Enforces code quality and consistency standards
 */

module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
};
