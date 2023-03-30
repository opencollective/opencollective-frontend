import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { get, sortBy } from 'lodash';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import AdminContributeCardsContainer from '../../contribute-cards/AdminContributeCardsContainer';
import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Grid } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { listTierQuery } from '../tiers/EditTierModal';

const prepareCards = (collective, sortedTiers) => {
  return sortedTiers.map(tier => {
    return {
      key: tier.id,
      Component: ContributeTier,
      componentProps: {
        collective,
        tier,
        hideContributors: true,
        hideCTA: true,
      },
    };
  });
};

const CardsContainer = styled(Grid).attrs({
  justifyItems: 'center',
  gridGap: '30px',
  gridTemplateColumns: ['repeat(auto-fit, minmax(280px, 1fr))'],
  gridAutoRows: ['1fr'],
})`
  & > * {
    padding: 0;
  }
`;

/**
 * A revamp of `components/edit-collective/sections/Tiers.js`. Meant to be renamed once we'll be ready
 * to replace the old tiers form.
 */
const Tickets = ({ collective }) => {
  const variables = { accountSlug: collective.slug };
  const { data, loading, error, refetch } = useQuery(listTierQuery, { variables, context: API_V2_CONTEXT });
  const tiers = sortBy(get(data, 'account.tiers.nodes', []), 'legacyId');
  const tickets = tiers.filter(tier => tier.type === 'TICKET');
  return (
    <Box my={4}>
      {loading ? (
        <LoadingPlaceholder height={500} width="100%" />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <AdminContributeCardsContainer
          collective={collective}
          cards={prepareCards(collective, tickets)}
          CardsContainer={CardsContainer}
          useTierModals
          enableReordering={false}
          createNewType="TICKET"
          onTierUpdate={() => refetch()}
        />
      )}
    </Box>
  );
};

Tickets.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
  }).isRequired,
};

export default Tickets;
