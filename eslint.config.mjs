import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules, includeIgnoreFile } from '@eslint/compat';
import openCollectiveConfig from 'eslint-config-opencollective/eslint-react.config.cjs';
import formatjs from 'eslint-plugin-formatjs';
import globals from 'globals';
import graphqlPlugin from '@graphql-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  ...openCollectiveConfig,
  includeIgnoreFile(gitignorePath),
  globalIgnores(['lib/graphql/types/v2/*', 'lib/graphql/*.graphql']),
  {
    files: ['**/*.js', '**/*.jsx'],

    extends: fixupConfigRules(
      compat.extends('plugin:styled-components-a11y/recommended', 'plugin:react-hooks/recommended'),
    ),

    plugins: {
      formatjs,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: ['tsconfig.json'],
      },
    },

    rules: {
      'no-console': 'error',
      'require-atomic-updates': 'off',

      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],

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
      'react/prop-types': ['error'],
      'react/sort-comp': ['error'],
      'react/no-this-in-sfc': ['error'],

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

      'formatjs/enforce-default-message': ['error'],
      'formatjs/enforce-plural-rules': ['error'],
      'formatjs/no-multiple-whitespaces': ['error'],
      'formatjs/no-offset': ['error'],
      'formatjs/enforce-placeholders': ['off'],
      'formatjs/no-camel-case': ['off'],
      'formatjs/no-emoji': ['off'],
      'formatjs/no-multiple-plurals': ['off'],

      'formatjs/enforce-id': [
        'error',
        {
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          idWhitelist: ['^.{1,}$'],
        },
      ],

      'jsx-a11y/no-autofocus': ['off'],
      'jsx-a11y/label-has-associated-control': ['off'],
      'styled-components-a11y/html-has-lang': ['off'],
      'styled-components-a11y/iframe-has-title': ['off'],
      'styled-components-a11y/label-has-associated-control': ['off'],
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],

    extends: fixupConfigRules(
      compat.extends('plugin:styled-components-a11y/recommended', 'plugin:react-hooks/recommended'),
    ),

    plugins: {
      formatjs,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: ['tsconfig.json'],
      },
    },

    rules: {
      'no-console': 'error',
      'require-atomic-updates': 'off',

      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],

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
      'react/prop-types': 'off',
      'react/sort-comp': ['error'],
      'react/no-this-in-sfc': ['error'],

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

      'formatjs/enforce-default-message': ['error'],
      'formatjs/enforce-plural-rules': ['error'],
      'formatjs/no-multiple-whitespaces': ['error'],
      'formatjs/no-offset': ['error'],
      'formatjs/enforce-placeholders': ['off'],
      'formatjs/no-camel-case': ['off'],
      'formatjs/no-emoji': ['off'],
      'formatjs/no-multiple-plurals': ['off'],

      'formatjs/enforce-id': [
        'error',
        {
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          idWhitelist: ['^.{1,}$'],
        },
      ],

      'jsx-a11y/no-autofocus': ['off'],
      'jsx-a11y/label-has-associated-control': ['off'],
      'styled-components-a11y/html-has-lang': ['off'],
      'styled-components-a11y/iframe-has-title': ['off'],
      'styled-components-a11y/label-has-associated-control': ['off'],
      'n/no-unsupported-features/node-builtins': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/consistent-type-exports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.graphql'],

    processor: graphqlPlugin.processor,

    plugins: {
      '@graphql-eslint': graphqlPlugin,
    },

    languageOptions: {
      parser: graphqlPlugin.parser,
    },

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
  {
    files: ['scripts/*.js'],

    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['server/*.js', '**/*.config.js', '**/env.js'],

    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['**/*.tsx'],

    rules: {
      'react/prop-types': 'off',
    },
  },
]);
