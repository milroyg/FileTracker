// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'coverage/*', 'android/*', 'ios/*'],
  },
  {
    // Every Text/TextInput goes through AppText/AppTextInput, which apply the
    // app's Inter font. The New Architecture dropped the global
    // Text.defaultProps override, so a wrapper is the only reliable way to
    // enforce one font app-wide. Type-only imports are still allowed.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message:
                "Import AppText/AppTextInput from 'src/components/common' instead — they enforce the app's Inter font.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/common/AppText.tsx', 'src/components/common/AppTextInput.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  {
    // The logger is the one place allowed to touch the console.
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Plain Node scripts (run with `node`, never bundled into the app).
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
]);
