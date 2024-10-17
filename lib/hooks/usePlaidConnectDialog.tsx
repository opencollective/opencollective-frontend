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
} from '../graphql/types/v2/graphql';

const generatePlaidLinkTokenMutation = gql`
  mutation GeneratePlaidLinkToken {
    generatePlaidLinkToken {
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

type PlaidDialogStatus = 'idle' | 'loading' | 'active' | 'disabled' | 'success';

export const usePlaidConnectDialog = ({
  host,
  onSuccess,
}): {
  status: PlaidDialogStatus;
  show: () => void;
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
  const linkToken = plaidTokenData?.generatePlaidLinkToken?.linkToken;
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onEvent: eventName => {
      if (eventName === 'OPEN') {
        setStatus('active');
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
      onSuccess?.(result.data.connectPlaidAccount);
    },
  });

  const show = React.useCallback(async () => {
    if (status === 'idle') {
      try {
        setStatus('loading');
        await generatePlaidToken(); // The process will continue when the `React.useEffect` below detects the token
      } catch (error) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        setStatus('idle');
      }
    }
  }, [intl, status, generatePlaidToken, toast]);

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
