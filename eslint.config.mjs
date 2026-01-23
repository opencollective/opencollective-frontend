import { includeIgnoreFile } from '@eslint/compat';
import graphqlPlugin from '@graphql-eslint/eslint-plugin'; // eslint-disable-line import/no-unresolved
import tsParser from '@typescript-eslint/parser'; // eslint-disable-line import/no-unresolved
import { defineConfig, globalIgnores } from 'eslint/config'; // eslint-disable-line import/no-unresolved
import openCollectiveConfig from 'eslint-config-opencollective/eslint-react.config.cjs';
import pluginCypress from 'eslint-plugin-cypress/flat'; // eslint-disable-line import/no-unresolved
import formatjs from 'eslint-plugin-formatjs';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import styledA11y from 'eslint-plugin-styled-components-a11y';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

// ts-unused-exports:disable-next-line
export default defineConfig([
  ...openCollectiveConfig,
  pluginCypress.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  styledA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  includeIgnoreFile(gitignorePath),
  globalIgnores(['lib/graphql/types/v2/*', 'lib/graphql/*.graphql']),

  // Common config
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    processor: graphqlPlugin.processor,
    plugins: { formatjs },
    languageOptions: {
      globals: { ...globals.jest },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { project: ['tsconfig.json'] },
    },
    settings: {
      'import/resolver': {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: true,
        node: true,
      },
    },
    rules: {
      'no-console': 'error',
      'require-atomic-updates': 'off',
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-intl',
              importNames: ['FormattedHTMLMessage'],
              message: 'FormattedHTMLMessage is not allowed, please rely on the standard FormattedMessage.',
            },
            {
              name: 'next/link',
              message: 'Next Link is not supposed to be used direclty. Please use components/Link instead.',
            },
          ],
          patterns: [
            {
              group: ['@styled-icons/*', '!@styled-icons/*/'],
              message:
                "Add icon name to import path. Example: '@styled-icons/fa-solid' to '@styled-icons/fa-solid/Lock'.",
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'it',
          property: 'only',
          message: 'it.only should only be used for debugging purposes and is not allowed in production code',
        },
        {
          object: 'describe',
          property: 'only',
          message: 'describe.only should only be used for debugging purposes and is not allowed in production code',
        },
      ],
      'react/jsx-fragments': ['error', 'element'],
      'react/react-in-jsx-scope': ['error'],
      'react/sort-comp': ['error'],
      'react/no-this-in-sfc': ['error'],
      'react/prop-types': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      'jsx-a11y/no-autofocus': ['off'],
      'jsx-a11y/label-has-associated-control': ['off'],
      'styled-components-a11y/label-has-associated-control': 'off',
      'styled-components-a11y/html-has-lang': ['off'],
      'styled-components-a11y/iframe-has-title': ['off'],

      // Disable new React Compiler rules from eslint-plugin-react-hooks v7
      // These rules are stricter and would require significant refactoring
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/void-use-memo': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',

      // Format.js rules
      'formatjs/enforce-default-message': ['error'],
      'formatjs/enforce-plural-rules': ['error'],
      'formatjs/no-multiple-whitespaces': ['error'],
      'formatjs/no-offset': ['error'],
      'formatjs/enforce-id': [
        'error',
        {
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          idWhitelist: ['^.{1,}$'],
        },
      ],

      // Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            [
              '^(_http_agent|_http_client|_http_common|_http_incoming|_http_outgoing|_http_server|_stream_duplex|_stream_passthrough|_stream_readable|_stream_transform|_stream_wrap|_stream_writable|_tls_common|_tls_wrap|assert|assert/strict|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|diagnostics_channel|dns|dns/promises|domain|events|fs|fs/promises|http|http2|https|inspector|inspector/promises|module|net|os|path|path/posix|path/win32|perf_hooks|process|punycode|querystring|readline|readline/promises|repl|stream|stream/consumers|stream/promises|stream/web|string_decoder|sys|timers|timers/promises|tls|trace_events|tty|url|util|util/types|v8|vm|wasi|worker_threads|zlib)(/|$)',
            ],
            ['^react$', '^prop-types$', '^@?\\w'],
            ['(.*)/lib/', '(.*)/server/', '(.*)/test/'],
            ['(.*)/components/'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
            ['public/static/images', '^.+\\.svg$', '^.+\\.png$'],
          ],
        },
      ],
    },
  },

  // JS/JSX config
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: { formatjs },
    rules: {
      'no-unused-vars': ['error'],
    },
  },

  // TS/TSX config
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-exports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'error',
      'react/prop-types': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
    },
  },

  // GraphQL config
  {
    files: ['**/*.graphql'],
    processor: graphqlPlugin.processor,
    plugins: { '@graphql-eslint': graphqlPlugin },
    languageOptions: { parser: graphqlPlugin.parser },
    rules: {
      '@graphql-eslint/no-deprecated': 'warn',
      '@graphql-eslint/fields-on-correct-type': 'error',
      '@graphql-eslint/no-duplicate-fields': 'error',
      '@graphql-eslint/naming-convention': [
        'error',
        {
          VariableDefinition: 'camelCase',
          OperationDefinition: {
            style: 'PascalCase',
            forbiddenPrefixes: ['get', 'fetch'],
            forbiddenSuffixes: ['Query', 'Mutation', 'Fragment'],
          },
        },
      ],
    },
  },

  // Scripts config
  {
    files: ['scripts/**/*.+(js|ts)'],
    rules: {
      'no-console': 'off',
      'n/no-process-exit': 'off',
    },
  },

  // Server/config files
  {
    files: ['server/*.js', '**/*.config.js', '**/env.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // Cypress tests
  {
    files: ['test/cypress/**/*.js', 'test/cypress/**/*.ts'],
    rules: {
      'cypress/no-unnecessary-waiting': 'warn',
      'cypress/unsafe-to-chain-command': 'warn',
      'cypress/no-assigning-return-values': 'warn',
    },
  },
]);
