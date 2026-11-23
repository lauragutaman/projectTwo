const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['hosted/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['server/**/*.js', '*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.browser, ...globals.commonjs },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];