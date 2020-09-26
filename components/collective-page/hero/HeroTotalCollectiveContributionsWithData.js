import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Box } from '../../Grid';
import { P } from '../../Text';

export const totalCollectiveContributionsQuery = gql`
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

const amountStyles = { fontSize: '20px', fontWeight: 'bold' };

/**
 * This component fetches its own data because we don't want to query these fields
 * for regular collective.
 */
const HeroTotalCollectiveContributionsWithData = ({ collective }) => {
  const { data, loading, error } = useQuery(totalCollectiveContributionsQuery, {
    variables: getTotalCollectiveContributionsQueryVariables(collective.slug),
  });

  if (error || loading || !get(data, 'Collective.stats.totalAmountSpent')) {
    return null;
  }

  const { stats, currency } = data.Collective;
  return (
    <Box my={2}>
      <P fontSize="10px" textTransform="uppercase">
        <FormattedMessage id="membership.totalDonations" defaultMessage="Total amount contributed" />
      </P>
      <FormattedMoneyAmount amount={stats.totalAmountSpent} currency={currency} amountStyles={amountStyles} />
    </Box>
  );
};

HeroTotalCollectiveContributionsWithData.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default HeroTotalCollectiveContributionsWithData;
