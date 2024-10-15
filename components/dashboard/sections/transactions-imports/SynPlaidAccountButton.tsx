import React, { useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import { RefreshCw } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { usePrevious } from '../../../../lib/hooks/usePrevious';

import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

const syncPlaidAccountMutation = gql`
  mutation SyncPlaidAccount($connectedAccount: ConnectedAccountReferenceInput!) {
    syncPlaidAccount(connectedAccount: $connectedAccount) {
      id
    }
  }
`;

export const SynPlaidAccountButton = ({ hasRequestedSync, setHasRequestedSync, connectedAccountId, isSyncing }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [syncPlaidAccount] = useMutation(syncPlaidAccountMutation, { context: API_V2_CONTEXT });
  const setHasRequestedSyncTimeout = useRef(null);
  const prevIsSyncing = usePrevious(isSyncing);

  // Clear timeout on unmount
  React.useEffect(() => {
    return () => {
      if (setHasRequestedSyncTimeout.current) {
        clearTimeout(setHasRequestedSyncTimeout.current);
      }
    };
  }, []);

  // Reset wasClickedRecently when sync is done
  React.useEffect(() => {
    if (prevIsSyncing && !isSyncing) {
      if (setHasRequestedSyncTimeout.current) {
        clearTimeout(setHasRequestedSyncTimeout.current);
      }
    }
  }, [toast, intl, isSyncing, prevIsSyncing]);

  return (
    <Button
      size="xs"
      variant="outline"
      loading={isSyncing || hasRequestedSync}
      onClick={async () => {
        setHasRequestedSync(true);
        try {
          await syncPlaidAccount({ variables: { connectedAccount: { id: connectedAccountId } } });
          toast({
            message: (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} />
                <FormattedMessage defaultMessage="Bank account synchronization requested" id="7RMLZz" />
              </span>
            ),
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          setHasRequestedSync(false);
          return;
        }

        setHasRequestedSyncTimeout.current = setTimeout(() => {
          setHasRequestedSync(false);
          setHasRequestedSyncTimeout.current = null;
        }, 30_000);
      }}
    >
      <RefreshCw size={16} />
      <span className="hidden sm:inline">
        <FormattedMessage defaultMessage="Sync" id="sync" />
      </span>
    </Button>
  );
};
