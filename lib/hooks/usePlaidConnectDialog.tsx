import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import { usePlaidLink } from 'react-plaid-link';

import { useToast } from '../../components/ui/useToast';

import { getAccountReferenceInput } from '../collective';
import { i18nGraphqlException } from '../errors';
import { API_V2_CONTEXT } from '../graphql/helpers';
import type {
  ConnectPlaidAccountMutation,
  ConnectPlaidAccountMutationVariables,
  GeneratePlaidLinkTokenMutation,
  GeneratePlaidLinkTokenMutationVariables,
  RefreshPlaidAccountMutation,
  RefreshPlaidAccountMutationVariables,
} from '../graphql/types/v2/graphql';
import type { Host } from '../graphql/types/v2/schema';

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

const connectPlaidAccountMutation = gql`
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
      }
    }
  }
`;

const refreshPlaidAccountMutation = gql`
  mutation RefreshPlaidAccount($transactionImport: TransactionsImportReferenceInput) {
    refreshPlaidAccount(transactionImport: $transactionImport) {
      transactionsImport {
        id
        plaidAccounts {
          accountId
          mask
          name
          officialName
          subtype
          type
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
  disabled,
  onOpen,
  transactionImportId,
}: {
  host: Host;
  onConnectSuccess?: (result: ConnectPlaidAccountMutation['connectPlaidAccount']) => void;
  onUpdateSuccess?: () => void;
  disabled?: boolean;
  onOpen?: () => void;
  transactionImportId?: string;
}): {
  status: PlaidDialogStatus;
  show: (options?: { accountSelectionEnabled?: boolean }) => Promise<void>;
} => {
  const [status, setStatus] = React.useState<PlaidDialogStatus>('idle');
  const intl = useIntl();
  const { toast } = useToast();
  const [generatePlaidToken, { data: plaidTokenData, reset: resetPlaidToken }] = useMutation<
    GeneratePlaidLinkTokenMutation,
    GeneratePlaidLinkTokenMutationVariables
  >(generatePlaidLinkTokenMutation, { context: API_V2_CONTEXT });
  const [connectPlaidAccount] = useMutation<ConnectPlaidAccountMutation, ConnectPlaidAccountMutationVariables>(
    connectPlaidAccountMutation,
    { context: API_V2_CONTEXT },
  );
  const [refreshPlaidAccount] = useMutation<RefreshPlaidAccountMutation, RefreshPlaidAccountMutationVariables>(
    refreshPlaidAccountMutation,
    { context: API_V2_CONTEXT },
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
      if (err) {
        toast({ variant: 'error', message: err.display_message });
      }
    },
    onSuccess: async (publicToken, metadata) => {
      let result: Awaited<ReturnType<typeof connectPlaidAccount>>;

      if (transactionImportId) {
        // There is no need to re-connect the account in the API if the transaction import is already connected
        setStatus('success');
        try {
          await refreshPlaidAccount({ variables: { transactionImport: { id: transactionImportId } } });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          return;
        }

        onUpdateSuccess?.();
      } else {
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
    }: {
      accountSelectionEnabled?: boolean;
    } = {}) => {
      if (status === 'idle') {
        try {
          setStatus('loading');
          await generatePlaidToken({
            variables: {
              host: getAccountReferenceInput(host),
              transactionImport: transactionImportId ? { id: transactionImportId } : undefined,
              locale: intl.locale,
              accountSelectionEnabled,
            },
          });
          // The process will continue when the `React.useEffect` below detects the token
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
          setStatus('idle');
        }
      }
    },
    [intl, status, generatePlaidToken, toast, host, transactionImportId],
  );

  React.useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  return {
    status: !host || disabled ? 'disabled' : status,
    show,
  };
};
