const baseConfig = {
  processor: '@graphql-eslint/graphql',
  env: {
    jest: true,
  },
  extends: [
    'opencollective',
    'plugin:styled-components-a11y/recommended',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['simple-import-sort', 'formatjs'],
  rules: {
    'no-console': 'error',
    'require-atomic-updates': 'off',
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'node/no-missing-import': ['error', { tryExtensions: ['.js', '.ts', '.tsx'] }],
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
    // We can be stricter with these rules
    // because we don't have any occurences anymore
    'react/react-in-jsx-scope': ['error'],
    'react/prop-types': ['error'],
    'react/sort-comp': ['error'],
    'react/no-this-in-sfc': ['error'],
    // simple-import-sort
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Node.js builtins. You could also generate this regex if you use a `.js` config.
          // For example: `^(${require("module").builtinModules.join("|")})(/|$)`
          [
            '^(_http_agent|_http_client|_http_common|_http_incoming|_http_outgoing|_http_server|_stream_duplex|_stream_passthrough|_stream_readable|_stream_transform|_stream_wrap|_stream_writable|_tls_common|_tls_wrap|assert|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|http2|https|inspector|module|net|os|path|perf_hooks|process|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|trace_events|tty|url|util|v8|vm|worker_threads|zlib)(/|$)',
          ],
          // Packages.
          // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
          ['^react$', '^prop-types$', '^@?\\w'],
          // Libs
          ['(.*)/lib/', '(.*)/server/', '(.*)/test/'],
          // Components
          ['(.*)/components/'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Styles
          ['^.+\\.s?css$'],
          // Images
          ['public/static/images', '^.+\\.svg$', '^.+\\.png$'],
        ],
      },
    ],
    // formatjs
    'formatjs/enforce-default-message': ['error'],
    'formatjs/enforce-plural-rules': ['error'],
    'formatjs/no-multiple-whitespaces': ['error'],
    'formatjs/no-offset': ['error'],
    'formatjs/enforce-placeholders': ['off'],
    'formatjs/no-camel-case': ['off'],
    'formatjs/no-emoji': ['off'],
    'formatjs/no-multiple-plurals': ['off'],
    // styled-components-a11y
    'jsx-a11y/no-autofocus': ['off'],
    'jsx-a11y/label-has-associated-control': ['off'],
    'styled-components-a11y/html-has-lang': ['off'],
    'styled-components-a11y/iframe-has-title': ['off'],
    'styled-components-a11y/label-has-associated-control': ['off'],
  },
};

const graphqlConfig = {
  parser: '@graphql-eslint/eslint-plugin',
  plugins: ['@graphql-eslint'],
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
};

module.exports = {
  root: true,
  ignorePatterns: ['./lib/graphql/types/*', './lib/graphql/*.graphql'],
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      ...baseConfig,
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['tsconfig.json'],
      },
      ...baseConfig,
      extends: [...baseConfig.extends, 'plugin:@typescript-eslint/recommended'],
      rules: {
        ...baseConfig.rules,
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-var-requires': 'warn',
        '@typescript-eslint/consistent-type-exports': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        'react/prop-types': 'off',
        // https://typescript-eslint.io/troubleshooting/performance-troubleshooting/#eslint-plugin-import
        'import/named': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['*.graphql'],
      ...graphqlConfig,
    },
    {
      files: ['scripts/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
