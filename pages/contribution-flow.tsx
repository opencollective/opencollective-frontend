import React from 'react';
import { useQuery } from '@apollo/client';
import { get, omit } from 'lodash-es';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../lib/url-helpers';
import { isHiddenAccount } from '@/lib/collective';

import Container from '../components/Container';
import ContributionBlocker, {
  CONTRIBUTION_BLOCKER,
  getContributionBlocker,
} from '../components/contribution-flow/ContributionBlocker';
import { contributionFlowAccountQuery } from '../components/contribution-flow/graphql/queries';
import ContributionFlowContainer from '../components/contribution-flow/index';
import { getContributionFlowMetadata } from '../components/contribution-flow/utils';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';
import Redirect from '../components/Redirect';
import { useStripeLoader } from '../components/StripeProvider';

import Custom404 from './404';

type ContributionFlowPageProps = {
  collectiveSlug: string;
  tierId: number | null;
  error: string;
};

const ContributionFlowPage = ({ collectiveSlug, tierId, error }: ContributionFlowPageProps) => {
  const router = useRouter();
  const intl = useIntl();
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

  React.useEffect(() => {
    const queryParameters = {
      ...omit(router.query, ['verb', 'step', 'collectiveSlug']),
    };
    addParentToURLIfMissing(router, account, `/${router.query.verb}/${router.query.step ?? ''}`, queryParameters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preserve componentDidMount behavior
  }, []);

  const accountHost = account?.host;

  React.useEffect(() => {
    const supportedPaymentMethods = get(account, 'host.supportedPaymentMethods', []);
    if (supportedPaymentMethods.includes(GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES.CREDIT_CARD)) {
      loadStripe();
    }
  }, [account, accountHost, loadStripe]);

  React.useEffect(() => {
    if (LoggedInUser && !me) {
      refetch();
    }
  }, [LoggedInUser, me, refetch]);

  const pageMetadata = React.useMemo(() => getContributionFlowMetadata(intl, account, tier), [intl, account, tier]);

  const noRobots = React.useMemo(() => {
    const personalInfoFields = ['contributeAs', 'customData', 'redirect', 'email', 'name', 'legalName'];
    return personalInfoFields.some(field => Boolean(router.query?.[field]));
  }, [router.query]);

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
      if (contributionBlocker.reason === CONTRIBUTION_BLOCKER.NO_CUSTOM_CONTRIBUTION) {
        return <Redirect to={`${getCollectivePageRoute(account)}/contribute`} />;
      }

      return <ContributionBlocker blocker={contributionBlocker} account={account} />;
    } else {
      return (
        <ContributionFlowContainer
          collective={account}
          host={account.host}
          tier={tier}
          contributorProfiles={me?.contributorProfiles || []}
          error={error}
        />
      );
    }
  };

  if (!loading && !account) {
    const pageError = queryError ? getErrorFromGraphqlException(queryError) : generateNotFoundError(collectiveSlug);

    return <ErrorPage error={pageError} />;
  } else if (!loading && account && isHiddenAccount(account)) {
    return <Custom404 />;
  }

  return (
    <Page
      {...pageMetadata}
      showFooter={false}
      showMenuItems={false}
      showSearch={false}
      collective={account}
      noRobots={noRobots}
    >
      {renderPageContent()}
    </Page>
  );
};

ContributionFlowPage.getInitialProps = ({ query }: NextPageContext) => {
  return {
    // Route parameters
    collectiveSlug: query.eventSlug || query.collectiveSlug,
    tierId: parseInt(query.tierId as string) || null,
    // Query parameters
    error: query.error,
  };
};

// next.js export
// ts-unused-exports:disable-next-line
export default ContributionFlowPage;
