import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import { usePlaidLink } from 'react-plaid-link';

import { useToast } from '../../components/ui/useToast';

import { getAccountReferenceInput } from '../collective';
import { i18nGraphqlException } from '../errors';
import type {
  ConnectPlaidAccountMutation,
  ConnectPlaidAccountMutationVariables,
  GeneratePlaidLinkTokenMutation,
  GeneratePlaidLinkTokenMutationVariables,
  Host,
  RefreshPlaidAccountMutation,
  RefreshPlaidAccountMutationVariables,
} from '../graphql/types/v2/graphql';
import { LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';

const generatePlaidLinkTokenMutation = gql`
  mutation GeneratePlaidLinkToken(
    $host: AccountReferenceInput!
    $transactionImport: TransactionsImportReferenceInput
    $locale: Locale
    $accountSelectionEnabled: Boolean
  ) {
    generatePlaidLinkToken(
      host: $host
      transactionImport: $transactionImport
      locale: $locale
      accountSelectionEnabled: $accountSelectionEnabled
    ) {
      linkToken
      expiration
      requestId
      hostedLinkUrl
    }
  }
`;

export const connectPlaidAccountMutation = gql`
  mutation ConnectPlaidAccount(
    $publicToken: String!
    $host: AccountReferenceInput!
    $sourceName: String
    $name: String
  ) {
    connectPlaidAccount(publicToken: $publicToken, host: $host, sourceName: $sourceName, name: $name) {
      connectedAccount {
        id
      }
      transactionsImport {
        id
        account {
          id
          slug
        }
      }
    }
  }
`;

export const refreshPlaidAccountMutation = gql`
  mutation RefreshPlaidAccount($transactionImport: TransactionsImportReferenceInput) {
    refreshPlaidAccount(transactionImport: $transactionImport) {
      transactionsImport {
        id
        source
        name
        account {
          id
          slug
        }
        institutionAccounts {
          id
          name
          type
          subtype
          mask
        }
      }
    }
  }
`;

export type PlaidDialogStatus = 'idle' | 'loading' | 'active' | 'disabled' | 'success';

export const usePlaidConnectDialog = ({
  host,
  onConnectSuccess,
  onUpdateSuccess,
  onOpen,
}: {
  host: Host;
  onConnectSuccess?: (result: ConnectPlaidAccountMutation['connectPlaidAccount']) => void;
  onUpdateSuccess?: (result: RefreshPlaidAccountMutation['refreshPlaidAccount']) => void;
  onOpen?: () => void;
}): {
  status: PlaidDialogStatus;
  show: (options?: { accountSelectionEnabled?: boolean; transactionImportId?: string }) => Promise<void>;
} => {
  const [status, setStatus] = React.useState<PlaidDialogStatus>('idle');
  const intl = useIntl();
  const { toast } = useToast();
  const [transactionImportId, setTransactionImportId] = React.useState<string | undefined>(undefined);
  const [generatePlaidToken, { data: plaidTokenData, reset: resetPlaidToken }] = useMutation<
    GeneratePlaidLinkTokenMutation,
    GeneratePlaidLinkTokenMutationVariables
  >(generatePlaidLinkTokenMutation);
  const [connectPlaidAccount] = useMutation<ConnectPlaidAccountMutation, ConnectPlaidAccountMutationVariables>(
    connectPlaidAccountMutation,
  );
  const [refreshPlaidAccount] = useMutation<RefreshPlaidAccountMutation, RefreshPlaidAccountMutationVariables>(
    refreshPlaidAccountMutation,
  );
  const linkToken = plaidTokenData?.generatePlaidLinkToken?.linkToken;
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onEvent: eventName => {
      if (eventName === 'OPEN') {
        setStatus('active');
        onOpen?.();
      }
    },
    onExit: err => {
      resetPlaidToken();
      setStatus('idle');
      setTransactionImportId(undefined);
      if (err) {
        toast({ variant: 'error', message: err.display_message });
      }
    },
    onSuccess: async (publicToken, metadata) => {
      if (transactionImportId) {
        let result: Awaited<ReturnType<typeof refreshPlaidAccount>>;
        try {
          result = await refreshPlaidAccount({ variables: { transactionImport: { id: transactionImportId } } });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          return;
        }

        setStatus('success');
        onUpdateSuccess?.(result.data?.refreshPlaidAccount);
      } else {
        let result: Awaited<ReturnType<typeof connectPlaidAccount>>;
        try {
          result = await connectPlaidAccount({
            variables: {
              publicToken,
              host: getAccountReferenceInput(host),
              sourceName: metadata.institution.name,
              name: metadata.accounts.map(a => a.name).join(', '),
            },
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          return;
        }

        setStatus('success');
        onConnectSuccess?.(result.data?.connectPlaidAccount);
      }
    },
  });

  const show = React.useCallback(
    async ({
      accountSelectionEnabled,
      transactionImportId,
    }: {
      accountSelectionEnabled?: boolean;
      transactionImportId?: string | undefined;
    } = {}) => {
      if (status === 'idle' || status === 'success') {
        try {
          setStatus('loading');
          setTransactionImportId(transactionImportId);

          const result = await generatePlaidToken({
            variables: {
              host: getAccountReferenceInput(host),
              transactionImport: transactionImportId ? { id: transactionImportId } : undefined,
              locale: intl.locale,
              accountSelectionEnabled,
            },
          });

          // We store the link token in local storage to be accessible from the OAuth flow
          // later on. The token quickly expire, so it is safe to keep it in local storage.
          setLocalStorage(
            LOCAL_STORAGE_KEYS.PLAID_LINK_TOKEN,
            JSON.stringify({
              hostId: host.id,
              transactionImportId,
              token: result.data.generatePlaidLinkToken.linkToken,
            }),
          );

          // The process will continue when the `React.useEffect` below detects the token
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
          setStatus('idle');
        }
      }
    },
    [intl, status, generatePlaidToken, toast, host],
  );

  React.useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  return {
    status: !host ? 'disabled' : status,
    show,
  };
};
