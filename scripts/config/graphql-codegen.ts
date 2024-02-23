import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  documents: ['pages/**/*.(ts|tsx)', 'components/**/*.(ts|tsx)', '!src/gql/**/*'],
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
      plugins: [
        {
          add: {
            content: '/* ignore unused exports */',
          },
        },
      ],
    },
  },
  pluckConfig: {
    globalGqlIdentifierName: 'gql',
    gqlMagicComment: 'GraphQLV2',
  },
};

// ignore unused exports default
// config file

export default config;
