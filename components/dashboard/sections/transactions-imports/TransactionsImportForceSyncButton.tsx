import React, { useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import { RefreshCw } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { usePrevious } from '../../../../lib/hooks/usePrevious';

import type { ButtonProps } from '../../../ui/Button';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

const syncTransactionsImportMutation = gql`
  mutation SyncTransactionsImport($transactionImport: TransactionsImportReferenceInput!) {
    syncTransactionsImport(transactionImport: $transactionImport) {
      id
    }
  }
`;

export const TransactionsImportForceSyncButton = ({
  hasRequestedSync,
  setHasRequestedSync,
  transactionImportId,
  isSyncing,
  ...props
}: {
  hasRequestedSync: boolean;
  setHasRequestedSync: (hasRequestedSync: boolean) => void;
  transactionImportId: string;
  isSyncing: boolean;
} & ButtonProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [syncTransactionsImport] = useMutation(syncTransactionsImportMutation);
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
      {...props}
      onClick={async () => {
        setHasRequestedSync(true);
        try {
          await syncTransactionsImport({ variables: { transactionImport: { id: transactionImportId } } });
          toast({
            message: (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin duration-1500" />
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
        <FormattedMessage defaultMessage="Synchronize" id="Rih0DL" />
      </span>
    </Button>
  );
};
