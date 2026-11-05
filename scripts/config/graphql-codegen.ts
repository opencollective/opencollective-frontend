import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Test files may define local cache/mocking fixtures that are not real documents: keep them out of
  // the codegen scope so an ad-hoc test query cannot break type generation.
  documents: [
    'pages/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/hooks/**/*.{ts,tsx}',
    '!src/gql/**/*',
    '!**/*.test.{ts,tsx}',
  ],
  config: {
    namingConvention: {
      enumValues: 'keep', // Otherwise we end up with duplicate enum value, e.g. in PaymentMethodType where we have "creditcard" (deprecated) and "CREDITCARD"
    },
  },
  generates: {
    './lib/graphql/types/v2/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      schema: './lib/graphql/schemaV2.graphql',
    },
  },
  pluckConfig: {
    globalGqlIdentifierName: 'gql',
    gqlMagicComment: 'GraphQLV2',
  },
};

// config file
// ts-unused-exports:disable-next-line
export default config;
