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
        //  grep -rl " gqlV1/" ./components ./lib ./pages | xargs grep -rL "gql\`" | sort
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
        'components/edit-collective/sections/CollectiveGoals.js',
        'components/edit-collective/sections/FiscalHosting.js',
        'components/edit-collective/sections/GiftCards.js',
        'components/edit-collective/sections/PaymentReceipts.js',
        'components/edit-collective/sections/SendingMoney.js',
        'components/edit-collective/sections/Webhooks.js',
        'components/tier-page/graphql/queries.js',
        'components/tier-page/index.js',
        'lib/graphql/mutations.js',
        'pages/confirmEmail.js',
        'pages/contribute.js',
        'pages/redeem.js',
        'pages/redeemed.js',
        'pages/updatePaymentMethod.js',
        // The following documents use gql and gqlV1 at the same time, gqlV1 will not be linted
        // grep -rl " gqlV1/" ./components ./lib ./pages | xargs grep -rl "gql\`" | sort
        // TODO: move gqlV1 queries and mutations to a dedicated file
        // components/EditTagsModal.tsx
        // components/SendMoneyToCollectiveBtn.js
        // components/changelog/ChangelogTrigger.js
        // components/collective-page/graphql/mutations.js
        // components/edit-collective/mutations.js
        // components/edit-collective/sections/EditCollectivePage.js
        // components/edit-collective/sections/PaymentMethods.js
        // components/edit-collective/sections/Policies.js
        // components/expenses/ExpenseFormPayeeStep.js
        // components/onboarding-modal/OnboardingModal.js
        // components/root-actions/UnhostAccountForm.js
        // lib/graphql/queries.js
        // pages/banner-iframe.js
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
