import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Box } from '../../Grid';
import { P } from '../../Text';

const totalCollectiveContributionsQuery = gql`
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
  const { data, loading, error } = useQuery(totalCollectiveContributionsQuery, {
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
