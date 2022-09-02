import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3060/graphql/v2',
  documents: ['pages/**/*.(ts|tsx)', 'components/**/*.(ts|tsx)'],
  generates: {
    './lib/graphql/types/v2': {
      preset: 'gql-tag-operations-preset',
      schema: 'http://localhost:3060/graphql/v2',
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo', 'fragment-matcher'],
    },
  },
};

export default config;
