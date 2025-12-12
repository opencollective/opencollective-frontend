import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { styled } from 'styled-components';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { sortTickets, TICKETS_ORDER_KEY } from '../../../lib/tier-utils';
import { TierTypes } from '@/lib/constants/tiers-types';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import AdminContributeCardsContainer from '../../contribute-cards/AdminContributeCardsContainer';
import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Grid } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { editAccountSettingsMutation } from '../mutations';
import { listTierQuery } from '../tiers/EditTierModal';

const getSortedContributeCards = (collective, sortedTiers) => {
  return sortedTiers.map(tier => {
    return {
      key: tier.legacyId,
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
  const [draggingId, setDraggingId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const variables = { accountSlug: collective.slug };
  const { data, loading, error: queryError, refetch } = useQuery(listTierQuery, { variables });
  const [editAccountSettings, { loading: isSubmitting }] = useMutation(editAccountSettingsMutation);

  // Sort tickets based on saved order
  const tiers = get(data, 'account.tiers.nodes', EMPTY_ARRAY);
  const orderKeys = get(collective.settings, TICKETS_ORDER_KEY, EMPTY_ARRAY);
  const tickets = React.useMemo(() => tiers.filter(tier => tier.type === TierTypes.TICKET), [tiers]);
  const sortedTickets = React.useMemo(() => sortTickets(tickets, orderKeys), [tickets, orderKeys]);

  const onTicketsReorder = async cards => {
    const cardKeys = cards.map(c => c.key);

    setError(null);
    try {
      await editAccountSettings({
        variables: {
          account: { legacyId: collective.id },
          key: TICKETS_ORDER_KEY,
          value: cardKeys,
        },
      });
    } catch (e) {
      setError(getErrorFromGraphqlException(e));
    }
  };

  return (
    <Box my={4}>
      {loading ? (
        <LoadingPlaceholder height={500} width="100%" />
      ) : queryError ? (
        <MessageBoxGraphqlError error={queryError} />
      ) : (
        <div>
          {error && <MessageBoxGraphqlError mb={5} error={error} />}
          <div>
            <AdminContributeCardsContainer
              collective={collective}
              cards={getSortedContributeCards(collective, sortedTickets)}
              CardsContainer={CardsContainer}
              enableReordering={true}
              createNewType="TICKET"
              onTierUpdate={() => refetch()}
              onReorder={onTicketsReorder}
              draggingId={draggingId}
              setDraggingId={setDraggingId}
              isSaving={isSubmitting}
              canEdit
            />
          </div>
        </div>
      )}
    </Box>
  );
};

export default Tickets;
