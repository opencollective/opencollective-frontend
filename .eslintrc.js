module.exports = {
  extends: 'next/core-web-vitals',
  plugins: ['formatjs'],
  rules: {
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
  },
};
