import React from 'react';
import { gql, useMutation } from '@apollo/client';
import Lottie from 'lottie-react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { confettiFireworks } from '@/lib/confettis';
import { i18nGraphqlException } from '@/lib/errors';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '@/lib/local-storage';
import { getOffPlatformTransactionsRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import AuthenticatedPage from '@/components/AuthenticatedPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

import * as SyncAnimation from '../../../public/static/animations/sync-bank-oc.json';

// GraphQL mutation for connecting GoCardless account
const connectGoCardlessAccountMutation = gql`
  mutation ConnectGoCardlessAccount(
    $requisitionId: String!
    $host: AccountReferenceInput!
    $transactionImport: TransactionsImportReferenceInput
  ) {
    connectGoCardlessAccount(requisitionId: $requisitionId, host: $host, transactionImport: $transactionImport) {
      connectedAccount {
        id
        service
        createdAt
      }
      transactionsImport {
        id
        account {
          id
          slug
        }
        createdAt
      }
    }
  }
`;

const getWindowData = () => {
  if (typeof window === 'undefined') {
    return {};
  } else {
    try {
      const gocardlessData = JSON.parse(getFromLocalStorage(LOCAL_STORAGE_KEYS.GOCARDLESS_DATA));
      return {
        requisitionId: gocardlessData.requisitionId,
        hostId: gocardlessData.hostId,
        transactionImportId: gocardlessData.transactionImportId,
      };
    } catch {
      return {};
    }
  }
};

const GoCardlessOAuthCallbackPage = () => {
  const intl = useIntl();
  const router = useRouter();
  const [apiError, setApiError] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const ref = router.query['ref'] as string;
  const windowData = getWindowData();

  const [connectGoCardlessAccount, { data }] = useMutation(connectGoCardlessAccountMutation);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsLoading(true);

        const result = await connectGoCardlessAccount({
          variables: {
            requisitionId: windowData.requisitionId,
            host: { id: windowData.hostId },
            ...(!windowData.transactionImportId ? {} : { transactionImport: { id: windowData.transactionImportId } }),
          },
        });

        const { transactionsImport } = result.data.connectGoCardlessAccount;
        const hostSlug = transactionsImport.account.slug;

        confettiFireworks(3000);
        router.push(getOffPlatformTransactionsRoute(hostSlug, transactionsImport.id));
      } catch (e) {
        setIsLoading(false);
        setApiError(i18nGraphqlException(intl, e));
      } finally {
        removeFromLocalStorage(LOCAL_STORAGE_KEYS.GOCARDLESS_DATA);
      }
    };

    if (ref && windowData.requisitionId && windowData.hostId) {
      handleCallback();
    }
  }, []);

  const hasSuccess = Boolean(data?.connectGoCardlessAccount?.transactionsImport);

  return (
    <AuthenticatedPage noRobots title={intl.formatMessage({ defaultMessage: 'Bank Account connection', id: 'NWBnhn' })}>
      {typeof window !== 'undefined' &&
      !hasSuccess &&
      !isLoading &&
      (!ref || !windowData.requisitionId || !windowData.hostId) ? (
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
export default GoCardlessOAuthCallbackPage;
