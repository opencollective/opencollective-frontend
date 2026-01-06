import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V1_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Box } from '../../Grid';
import { P } from '../../Text';

export const totalCollectiveContributionsQuery = gqlV1 /* GraphQL */ `
  query HeroTotalCollectiveContributions($slug: String!) {
    Collective(slug: $slug) {
      id
      currency
      stats {
        id
        totalAmountSpent
      }
    }
  }
`;

export const getTotalCollectiveContributionsQueryVariables = slug => {
  return { slug };
};

/**
 * This component fetches its own data because we don't want to query these fields
 * for regular collective.
 */
const HeroTotalCollectiveContributionsWithData = ({ collective }) => {
  const { data, loading, error } = useQuery(totalCollectiveContributionsQuery, {
    variables: getTotalCollectiveContributionsQueryVariables(collective.slug),
    context: API_V1_CONTEXT,
  });

  if (error || loading || !get(data, 'Collective.stats.totalAmountSpent')) {
    return null;
  }

  const { stats, currency } = data.Collective;
  return (
    <Box my={2} data-cy="hero-total-amount-contributed">
      <P fontSize="10px" textTransform="uppercase">
        <FormattedMessage id="membership.totalDonations" defaultMessage="Total amount contributed" />
      </P>
      <FormattedMoneyAmount amount={stats.totalAmountSpent} currency={currency} amountClassName="font-bold text-xl" />
    </Box>
  );
};

export default HeroTotalCollectiveContributionsWithData;
