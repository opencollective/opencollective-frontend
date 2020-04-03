import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { get } from 'lodash';
import { Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { P } from '../../Text';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';

const TotalCollectiveContributionsQuery = gql`
  query TotalCollectiveContributions($id: Int) {
    Collective(id: $id) {
      id
      currency
      stats {
        id
        totalAmountSpent
      }
    }
  }
`;

const amountStyles = { fontSize: 'H5', fontWeight: 'bold' };

/**
 * This component fetches its own data because we don't want to query these fields
 * for regular collective.
 */
const HeroTotalCollectiveContributionsWithData = ({ collective }) => {
  const { data, loading, error } = useQuery(TotalCollectiveContributionsQuery, {
    variables: { id: collective.id },
  });

  if (error || loading || !get(data, 'Collective.stats.totalAmountSpent')) {
    return null;
  }

  const { stats, currency } = data.Collective;
  return (
    <Box my={2}>
      <P fontSize="Tiny" textTransform="uppercase">
        <FormattedMessage id="membership.totalDonations" defaultMessage="Total amount contributed" />
      </P>
      <FormattedMoneyAmount amount={stats.totalAmountSpent} currency={currency} amountStyles={amountStyles} />
    </Box>
  );
};

HeroTotalCollectiveContributionsWithData.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default HeroTotalCollectiveContributionsWithData;
