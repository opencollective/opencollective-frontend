import React from 'react';
import { gql, useMutation } from '@apollo/client';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { confettiFireworks } from '@/lib/confettis';
import { i18nGraphqlException } from '@/lib/errors';
import type {
  ConnectTransferwiseAccountMutation,
  ConnectTransferwiseAccountMutationVariables,
} from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import AuthenticatedPage from '@/components/AuthenticatedPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

import * as SyncAnimation from '../../../../public/static/animations/sync-bank-oc.json';

const connectTransferwiseAccountMutation = gql`
  mutation ConnectTransferwiseAccount($code: String!, $profileId: String!, $state: String!) {
    connectTransferwiseAccount(code: $code, profileId: $profileId, state: $state) {
      connectedAccount {
        id
      }
      redirectUrl
    }
  }
`;

const TransferwiseOAuthCallbackPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSuccess, setHasSuccess] = React.useState(false);

  const code = router.query['code'] as string;
  const profileId = router.query['profileId'] as string;
  const state = router.query['state'] as string;
  const oauthError = router.query['error'] as string;

  const [connectTransferwiseAccount] = useMutation<
    ConnectTransferwiseAccountMutation,
    ConnectTransferwiseAccountMutationVariables
  >(connectTransferwiseAccountMutation);

  const hasValidParams = Boolean(code && profileId && state) && !oauthError;

  React.useEffect(() => {
    if (!router.isReady || !hasValidParams) {
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const result = await connectTransferwiseAccount({ variables: { code, profileId, state } });
        if (!isMounted) {
          return;
        }

        setHasSuccess(true);
        confettiFireworks(3000);
        const redirectUrl = result.data?.connectTransferwiseAccount?.redirectUrl;
        router.push(redirectUrl || '/dashboard');
      } catch (e) {
        if (isMounted) {
          setIsLoading(false);
          setApiError(i18nGraphqlException(intl, e));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // We only want to run this once, when the router becomes ready with valid params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return (
    <AuthenticatedPage noRobots title={intl.formatMessage({ defaultMessage: 'Wise connection', id: 'mv1Ym6' })}>
      {router.isReady && !hasSuccess && !isLoading && (!hasValidParams || apiError) ? (
        <div className="my-8 flex h-full flex-col items-center justify-center gap-3 p-2 sm:my-32">
          <div>
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertTitle>
                <FormattedMessage defaultMessage="Wise connection failed" id="0ZiG0o" />
              </AlertTitle>
              <AlertDescription>
                {apiError || oauthError || (
                  <FormattedMessage
                    defaultMessage="An error occurred while connecting your Wise account. Please try again."
                    id="4ea2HC"
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
                    <FormattedMessage defaultMessage="Connecting your Wise account..." id="vZ/6uw" />
                  </AlertTitle>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <CheckCircle size={18} className="mr-2 inline" />
                  <AlertTitle>
                    <FormattedMessage defaultMessage="Wise account connected!" id="cirTrV" />
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
export default TransferwiseOAuthCallbackPage;
