import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { P } from '../Text';
import FormattedMoneyAmount from '../FormattedMoneyAmount';

const TotalCollectiveContributionsQuery = gql`
  query TotalCollectiveContributions($id: Int) {
    Collective(id: $id) {
      id
      currency
      stats {
        id
        totalAmountSpent
        totalAmountRaised
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

  if (error || loading) {
    return null;
  }

  const { totalAmountSpent, totalAmountRaised } = data.Collective.stats;
  if (!totalAmountSpent && !totalAmountRaised) {
    return null;
  }

  return (
    <Flex flexWrap="wrap" my={2} justifyContent="center">
      {data.Collective.stats.totalAmountSpent > 0 && (
        <Box my={1}>
          <P fontSize="Tiny" textTransform="uppercase">
            <FormattedMessage id="collective.stats.totalAmountSpent.label" defaultMessage="Total amount contributed" />
          </P>
          <FormattedMoneyAmount
            amount={data.Collective.stats.totalAmountSpent}
            currency={data.Collective.currency}
            amountStyles={amountStyles}
          />
        </Box>
      )}
      {data.Collective.stats.totalAmountRaised > 0 && (
        <Box mx={4} my={1}>
          <P fontSize="Tiny" textTransform="uppercase">
            <FormattedMessage id="collective.stats.totalAmountRaised.label" defaultMessage="Total amount raised" />
          </P>
          <FormattedMoneyAmount
            amount={data.Collective.stats.totalAmountRaised}
            currency={data.Collective.currency}
            amountStyles={amountStyles}
          />
        </Box>
      )}
    </Flex>
  );
};

HeroTotalCollectiveContributionsWithData.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default HeroTotalCollectiveContributionsWithData;
