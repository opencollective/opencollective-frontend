module.exports = {
  // A file goes to the first project whose documents match it: graphqlV1 comes first so that its files are not taken
  // by the default project's broad glob.
  projects: {
    graphqlV1: {
      schema: 'lib/graphql/schema.graphql',
      documents: [
        // The following documents only use gqlV1
        // grep -rl " = gqlV1" ./components ./lib ./pages | xargs grep -rL "gql\`" | sort
        'components/collective-page/graphql/fragments.js',
        'components/collective-page/graphql/queries.js',
        'components/collective-page/hero/HeroTotalCollectiveContributionsWithData.js',
        'components/CollectivePickerAsync.tsx',
        'components/CreateCollectiveMiniForm.tsx',
        'components/edit-collective/sections/PaymentReceipts.tsx',
        'components/edit-collective/sections/Webhooks.tsx',
        'components/EditPublicMessagePopup.tsx',
        'components/MembershipsWithData.tsx',
        'components/MembersWithData.tsx',
        'components/SignInOrJoinFree.tsx',
        'components/tier-page/graphql/queries.ts',
        'lib/graphql/v1/fragments.ts',
        'lib/graphql/v1/mutations.ts',
        'lib/graphql/v1/queries.ts',
        'pages/contribute.js',
        'pages/updatePaymentMethod.js',
        // The following documents use gql and gqlV1 at the same time, gqlV1 will not be linted
        // grep -rl " = gqlV1" ./components ./lib ./pages | xargs grep -rl "gql\`" | sort
        // No file anymore and it should stay like that!
      ],
      extensions: {
        endpoints: {
          dev: 'http://localhost:3060/graphql/v1',
          prod: 'https://api.opencollective.com/graphql/v1',
        },
        pluckConfig: {
          globalGqlIdentifierName: 'gqlV1',
          gqlMagicComment: 'GraphQL',
        },
      },
    },
    default: {
      schema: 'lib/graphql/schemaV2.graphql',
      // Every gql document, so that unique-operation-name and unique-fragment-name can compare them
      documents: ['{components,lib,pages,test}/**/*.{js,jsx,ts,tsx}', '!lib/graphql/types/**'],
      extensions: {
        endpoints: {
          dev: 'http://localhost:3060/graphql/v2',
          prod: 'https://api.opencollective.com/graphql/v2',
        },
        pluckConfig: {
          globalGqlIdentifierName: 'gql',
          gqlMagicComment: 'GraphQLV2',
        },
      },
    },
  },
};
