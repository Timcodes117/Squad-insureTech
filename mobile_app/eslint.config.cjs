const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat.js');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.expo/**', 'babel.config.js', 'metro.config.js', 'tailwind.config.js'],
  },
]);
