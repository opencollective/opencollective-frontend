import React from 'react';
import { useMutation } from '@apollo/client';
import Lottie from 'lottie-react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePlaidLink } from 'react-plaid-link';

import { confettiFireworks } from '@/lib/confettis';
import { i18nGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { ConnectPlaidAccountMutation, ConnectPlaidAccountMutationVariables } from '@/lib/graphql/types/v2/graphql';
import { connectPlaidAccountMutation } from '@/lib/hooks/usePlaidConnectDialog';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '@/lib/local-storage';
import { getOffPlatformTransactionsRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import AuthenticatedPage from '@/components/AuthenticatedPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

import * as SyncAnimation from '../../../../public/static/animations/sync-bank-oc.json';

const getWindowData = () => {
  if (typeof window === 'undefined') {
    return {};
  } else {
    try {
      const plaidToken = JSON.parse(getFromLocalStorage(LOCAL_STORAGE_KEYS.PLAID_LINK_TOKEN));
      return {
        receivedRedirectUri: window.location.href,
        accessToken: plaidToken.token,
        hostId: plaidToken.hostId,
      };
    } catch {
      return {};
    }
  }
};

const PlaidOAuthCallbackPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const plaidStateId = router.query['oauth_state_id'] as string;
  const windowData = getWindowData();
  const [connectPlaidAccount, { data }] = useMutation<
    ConnectPlaidAccountMutation,
    ConnectPlaidAccountMutationVariables
  >(connectPlaidAccountMutation, { context: API_V2_CONTEXT });
  const { open, ready } = usePlaidLink({
    receivedRedirectUri: windowData.receivedRedirectUri,
    token: windowData.accessToken,
    onSuccess: async (publicToken, metadata) => {
      try {
        setIsLoading(true);
        const result = await connectPlaidAccount({
          variables: {
            publicToken,
            host: { id: windowData.hostId },
            sourceName: metadata.institution.name,
            name: metadata.accounts.map(a => a.name).join(', '),
          },
        });

        const { transactionsImport } = result.data.connectPlaidAccount;
        const hostSlug = transactionsImport.account.slug;
        confettiFireworks(3000);
        router.push(getOffPlatformTransactionsRoute(hostSlug, transactionsImport.id));
      } catch (e) {
        setIsLoading(false);
        setApiError(i18nGraphqlException(intl, e));
        removeFromLocalStorage(LOCAL_STORAGE_KEYS.PLAID_LINK_TOKEN);
      } finally {
        removeFromLocalStorage(LOCAL_STORAGE_KEYS.PLAID_LINK_TOKEN);
      }
    },
  });

  const hasValidWindowData = Boolean(windowData.accessToken && windowData.hostId);
  React.useEffect(() => {
    if (ready && plaidStateId && hasValidWindowData) {
      open();
    }
  }, [ready, plaidStateId, open, hasValidWindowData]);

  const hasSuccess = Boolean(data?.connectPlaidAccount?.transactionsImport);
  return (
    <AuthenticatedPage noRobots title={intl.formatMessage({ defaultMessage: 'Bank Account connection', id: 'NWBnhn' })}>
      {typeof window !== 'undefined' && !hasSuccess && !isLoading && (!hasValidWindowData || !plaidStateId) ? (
        <div className="my-8 flex h-full flex-col items-center justify-center gap-3 p-2 sm:my-32">
          <div>
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertTitle>
                <FormattedMessage defaultMessage="Bank connection failed" id="F/RkIr" />
              </AlertTitle>
              <AlertDescription>
                {apiError || (
                  <FormattedMessage
                    defaultMessage="An error occurred while connecting your bank account. Please try again."
                    id="qM7O8i"
                  />
                )}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      ) : (
        <div className="my-8 flex h-full flex-col items-center justify-center gap-3 p-2 sm:my-32">
          <Lottie animationData={SyncAnimation} loop autoPlay className="max-w-[600px]" />
          <div>
            <Alert
              className={cn('min-w-[275px] text-center shadow transition-all', hasSuccess && '[&>svg]:text-green-500')}
            >
              {!hasSuccess ? (
                <React.Fragment>
                  <Loader2 size={18} className="animate-spin" />
                  <AlertTitle className="animate-pulse">
                    <FormattedMessage defaultMessage="Connecting your bank account..." id="k++3cO" />
                  </AlertTitle>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <CheckCircle size={18} className="mr-2 inline" />
                  <AlertTitle>
                    <FormattedMessage defaultMessage="Bank account connected!" id="ZV3+T6" />
                  </AlertTitle>
                  <AlertDescription className="animate-pulse">
                    <FormattedMessage defaultMessage="You'll be redirected shortly." id="j0+O6x" />
                  </AlertDescription>
                </React.Fragment>
              )}
            </Alert>
          </div>
        </div>
      )}
    </AuthenticatedPage>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default PlaidOAuthCallbackPage;
