import React from 'react';
import { useQuery } from '@apollo/client';
import { get, sortBy } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { sortTickets, TICKETS_ORDER_KEY } from '../../../lib/tier-utils';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Button } from '../../ui/Button';
import { useTierActions } from '../tiers/actions';
import { listTierQuery } from '../tiers/EditTierModal';
import TiersTable from '../TiersTable';

/**
 * A revamp of `components/edit-collective/sections/Tiers.js`. Meant to be renamed once we'll be ready
 * to replace the old tiers form.
 */
const Tickets = ({ collective }) => {
  const [error, setError] = React.useState(null);

  const variables = { accountSlug: collective.slug };
  const { data, loading, error: queryError, refetch } = useQuery(listTierQuery, { variables, context: API_V2_CONTEXT });
  // editAccountSettings mutation is no longer needed here - handled in actions.tsx

  const tiers = sortBy(get(data, 'account.tiers.nodes', []), 'legacyId');
  const tickets = tiers.filter(tier => tier.type === 'TICKET');

  // Sort tickets based on saved order
  const orderKeys = get(collective.settings, TICKETS_ORDER_KEY, EMPTY_ARRAY);
  const sortedTickets = React.useMemo(() => sortTickets(tickets, orderKeys), [tickets, orderKeys]);

  const { getActions, handleEdit } = useTierActions({
    tiersOrderKey: TICKETS_ORDER_KEY,
    data: sortedTickets,
    collectiveId: collective.id,
    useIdAsKey: true, // Tickets use id as key, not legacyId
    refetch,
    setError,
    collective,
    forcedType: 'TICKET',
  });

  return (
    <Box my={4}>
      {loading ? (
        <LoadingPlaceholder height={500} width="100%" />
      ) : queryError ? (
        <MessageBoxGraphqlError error={queryError} />
      ) : (
        <div>
          {error && <MessageBoxGraphqlError mb={5} error={error} />}
          <Box mb={4} display="flex" justifyContent="flex-end">
            <Button
              data-cy="create-ticket"
              className="gap-1"
              size="sm"
              variant="outline"
              onClick={() => handleEdit(null)}
            >
              <span>
                <FormattedMessage id="SectionTickets.CreateTicket" defaultMessage="Create Ticket" />
              </span>
              <PlusIcon size={20} />
            </Button>
          </Box>
          <TiersTable
            data={sortedTickets}
            collective={collective}
            loading={false}
            getActions={getActions}
            emptyMessage={() => (
              <FormattedMessage defaultMessage="No tickets yet. Create your first ticket!" id="NoTicketsYet" />
            )}
          />
        </div>
      )}
    </Box>
  );
};

export default Tickets;
