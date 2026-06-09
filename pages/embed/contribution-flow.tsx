import React from 'react';
import { useQuery } from '@apollo/client';
import { get, omit, pick } from 'lodash-es';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';

import { generateNotFoundError, getErrorFromGraphqlException } from '../../lib/errors';
import { PaymentMethodLegacyType } from '../../lib/graphql/types/v2/graphql';
import { addParentToURLIfMissing } from '../../lib/url-helpers';
import { isHiddenAccount } from '@/lib/collective';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import CollectiveThemeProvider from '../../components/CollectiveThemeProvider';
import Container from '../../components/Container';
import ContributionBlocker, { getContributionBlocker } from '../../components/contribution-flow/ContributionBlocker';
import { contributionFlowAccountQuery } from '../../components/contribution-flow/graphql/queries';
import ContributionFlowContainer from '../../components/contribution-flow/index';
import { EmbedContributionFlowUrlQueryHelper } from '../../components/contribution-flow/query-parameters';
import EmbeddedPage from '../../components/EmbeddedPage';
import ErrorPage from '../../components/ErrorPage';
import { Box } from '../../components/Grid';
import Loading from '../../components/Loading';
import { useStripeLoader } from '../../components/StripeProvider';

import Custom404 from '../404';

type EmbedContributionFlowPageProps = {
  collectiveSlug: string;
  tierId: number | null;
  error: string;
  queryParams: Record<string, unknown>;
};

const EmbedContributionFlowPage = ({ collectiveSlug, tierId, error, queryParams }: EmbedContributionFlowPageProps) => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const { loadStripe } = useStripeLoader();
  const {
    data,
    loading,
    error: queryError,
    refetch,
  } = useQuery(contributionFlowAccountQuery, {
    variables: { collectiveSlug, tierId, includeTier: Boolean(tierId) },
  });

  const account = data?.account;
  const tier = data?.tier;
  const me = data?.me;
  const accountHost = account?.host;
  const prevLoggedInUserRef = React.useRef(LoggedInUser);

  const postMessage = React.useCallback((event: string, payload: unknown = null) => {
    if (window.parent) {
      try {
        const size = { height: document.body.scrollHeight, width: document.body.scrollWidth };
        const message: { event: string; size: typeof size; payload?: unknown } = { event, size };
        if (payload) {
          message.payload = payload;
        }

        window.parent.postMessage(message, '*');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Post message failed', e);
      }
    }
  }, []);

  const onResize = React.useCallback(() => {
    postMessage('resized');
  }, [postMessage]);

  React.useEffect(() => {
    const path = router.asPath;
    const rawPath = path.replace(new RegExp(`^/embed/${account?.slug}/`), '/');
    addParentToURLIfMissing(router, account, rawPath, undefined, { prefix: '/embed' });
    postMessage('initialized');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preserve componentDidMount behavior
  }, []);

  React.useEffect(() => {
    const supportedPaymentMethods = get(data, 'account.host.supportedPaymentMethods', []);
    if (supportedPaymentMethods.includes(PaymentMethodLegacyType.CREDIT_CARD)) {
      loadStripe();
    }
  }, [data, accountHost, loadStripe]);

  React.useEffect(() => {
    if (LoggedInUser && !prevLoggedInUserRef.current) {
      refetch();
    }
    prevLoggedInUserRef.current = LoggedInUser;
  }, [LoggedInUser, refetch]);

  const renderPageContent = () => {
    if (loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    const contributionBlocker = getContributionBlocker(LoggedInUser, account, tier, Boolean(tierId));
    if (contributionBlocker) {
      return <ContributionBlocker blocker={contributionBlocker} account={account} />;
    } else {
      return (
        <Box height="100%" pt={3}>
          <ContributionFlowContainer
            isEmbed
            collective={account}
            host={account.host}
            tier={tier}
            error={error}
            contributorProfiles={me?.contributorProfiles || []}
            onStepChange={step =>
              postMessage('stepChange', {
                step,
                height: document.body.scrollHeight,
                width: document.body.scrollWidth,
              })
            }
            onSuccess={order => {
              const successOrder = order as {
                id: string;
                legacyId: number;
                status: string;
                frequency: string;
                amount: Record<string, unknown>;
                platformTipAmount: Record<string, unknown>;
                tier: { id: string } | null;
                fromAccount: { id: string };
                toAccount: { id: string };
              };
              postMessage('success', {
                order: {
                  id: successOrder.id,
                  legacyId: successOrder.legacyId,
                  status: successOrder.status,
                  frequency: successOrder.frequency,
                  amount: omit(successOrder.amount, ['__typename']),
                  platformTipAmount: omit(successOrder.platformTipAmount, ['__typename']),
                  tier: successOrder.tier ? pick(successOrder.tier, ['id']) : null,
                  fromAccount: pick(successOrder.fromAccount, ['id']),
                  toAccount: pick(successOrder.toAccount, ['id']),
                },
              });
            }}
          />
        </Box>
      );
    }
  };

  if (!loading && !account) {
    const pageError = queryError ? getErrorFromGraphqlException(queryError) : generateNotFoundError(collectiveSlug);

    return <ErrorPage error={pageError} />;
  } else if (!loading && account && isHiddenAccount(account)) {
    return <Custom404 />;
  } else {
    return (
      <CollectiveThemeProvider collective={queryParams.useTheme ? account : null}>
        <EmbeddedPage backgroundColor={queryParams.backgroundColor}>{renderPageContent()}</EmbeddedPage>
      </CollectiveThemeProvider>
    );
  }
};

EmbedContributionFlowPage.getInitialProps = ({ query, res }: NextPageContext) => {
  if (res) {
    res.removeHeader('X-Frame-Options');
  }

  return {
    // Route parameters
    collectiveSlug: query.eventSlug || query.collectiveSlug,
    tierId: parseInt(query.tierId as string) || null,
    // Query parameters
    error: query.error,
    queryParams: EmbedContributionFlowUrlQueryHelper.decode(query),
  };
};

// next.js export
// ts-unused-exports:disable-next-line
export default EmbedContributionFlowPage;
