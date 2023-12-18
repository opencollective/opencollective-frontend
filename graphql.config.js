module.exports = {
  projects: {
    default: {
      schema: 'lib/graphql/schemaV2.graphql',
      documents: ['pages/**/*.(ts|tsx)', 'components/**/*.(ts|tsx)'],
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
    graphqlV1: {
      schema: 'lib/graphql/schema.graphql',
      documents: [
        // The following documents only use gqlV1
        // grep -rl " gqlV1/" ./components ./lib ./pages | xargs grep -rL "gql\`" | sort
        'components/CollectivePickerAsync.js',
        'components/CreateCollectiveMiniForm.tsx',
        'components/CreateGiftCardsForm.js',
        'components/EditPublicMessagePopup.js',
        'components/MembersWithData.js',
        'components/MembershipsWithData.js',
        'components/SignInOrJoinFree.js',
        'components/collective-page/graphql/fragments.js',
        'components/collective-page/graphql/queries.js',
        'components/collective-page/hero/HeroTotalCollectiveContributionsWithData.js',
        'components/edit-collective/CreateHostFormWithData.js',
        'components/edit-collective/EditTwitterAccount.js',
        'components/edit-collective/EditUserEmailForm.js',
        'components/edit-collective/actions/Archive.js',
        'components/edit-collective/actions/Delete.js',
        'components/edit-collective/sections/FiscalHosting.js',
        'components/edit-collective/sections/GiftCards.js',
        'components/edit-collective/sections/PaymentReceipts.js',
        'components/edit-collective/sections/Webhooks.js',
        'components/tier-page/graphql/queries.js',
        'components/tier-page/index.js',
        'lib/graphql/v1/fragments.js',
        'lib/graphql/v1/mutations.js',
        'lib/graphql/v1/queries.js',
        'pages/confirmEmail.js',
        'pages/contribute.js',
        'pages/redeem.js',
        'pages/redeemed.js',
        'pages/updatePaymentMethod.js',
        // The following documents use gql and gqlV1 at the same time, gqlV1 will not be linted
        // grep -rl " gqlV1/" ./components ./lib ./pages | xargs grep -rl "gql\`" | sort
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
  },
};
