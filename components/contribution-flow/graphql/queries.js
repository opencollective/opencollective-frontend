import { gql } from '@apollo/client';

import { contributionFlowAccountFieldsFragment } from './fragments';

export const contributionFlowAccountQuery = gql`
  query ContributionFlowAccountQuery($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      ...ContributionFlowAccountFields
    }
  }
  ${contributionFlowAccountFieldsFragment}
`;

export const contributionFlowAccountWithTierQuery = gql`
  query ContributionFlowAccountWithTierQuery($collectiveSlug: String!, $tier: TierReferenceInput!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
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
