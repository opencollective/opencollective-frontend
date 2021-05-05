import { gqlV2 } from '../../../lib/graphql/helpers';

import { contributionFlowAccountFieldsFragment } from './fragments';

export const contributionFlowAccountQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountQuery($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      ...ContributionFlowAccountFields
    }
  }
  ${contributionFlowAccountFieldsFragment}
`;

export const contributionFlowAccountWithTierQuery = gqlV2/* GraphQL */ `
  query ContributionFlowAccountWithTierQuery($collectiveSlug: String!, $tier: TierReferenceInput!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      ...ContributionFlowAccountFields
    }
    tier(tier: $tier, throwIfMissing: false) {
      id
      legacyId
      type
      name
      slug
      description
      customFields
      availableQuantity
      maxQuantity
      endsAt
      amount {
        valueInCents
        currency
      }
      amountType
      minimumAmount {
        valueInCents
        currency
      }
      interval
      presets
    }
  }
  ${contributionFlowAccountFieldsFragment}
`;
