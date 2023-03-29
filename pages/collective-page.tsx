import React from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { createGlobalStyle } from 'styled-components';

import { initClient } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective.lib';
import { generateNotFoundError } from '../lib/errors';
import useData from '../lib/hooks/useData';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectivePageContent from '../components/collective-page';
import CollectiveNotificationBar from '../components/collective-page/CollectiveNotificationBar';
import { collectivePageLoggedInUserQuery, collectivePageQuery } from '../components/collective-page/graphql/queries';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../components/contribute-cards/constants';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';

import Custom404 from './404';

/** A page rendered when collective is pledged and not active yet */
const PledgedCollectivePage = dynamic(
  () => import(/* webpackChunkName: 'PledgedCollectivePage' */ '../components/PledgedCollectivePage'),
  { loading: Loading },
);

/** A page rendered when collective is incognito */
const IncognitoUserCollective = dynamic(
  () => import(/* webpackChunkName: 'IncognitoUserCollective' */ '../components/IncognitoUserCollective'),
  { loading: Loading },
);

/** A page rendered when collective is guest */
const GuestUserProfile = dynamic(
  () => import(/* webpackChunkName: 'GuestUserProfile' */ '../components/GuestUserProfile'),
  { loading: Loading },
);

/** Load the onboarding modal dynamically since it's not used often */
const OnboardingModal = dynamic(
  () => import(/* webpackChunkName: 'OnboardingModal' */ '../components/onboarding-modal/OnboardingModal'),
  { loading: Loading },
);

const GlobalStyles = createGlobalStyle`
  section {
    margin: 0;
  }
`;

type CollectivePageQuery = {
  slug: string;
  status?: string;
  step?: string;
  mode?: string;
  action?: string;
};

type CollectivePageProps = {
  query: Partial<CollectivePageQuery>;
  data: any;
  error: any;
  serverState?: { apollo?: { data?: any } };
};

export const getServerSideProps: GetServerSideProps<
  CollectivePageProps,
  CollectivePageQuery,
  undefined
> = async context => {
  const { slug } = context.query;
  const client = initClient();
  context.res.setHeader('Cache-Control', 'public, s-maxage=40, stale-while-revalidate=60');

  const { data, error } = await client.query({
    query: collectivePageQuery,
    variables: { slug, nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD },
  });

  const serverState = {
    apollo: {
      data: client.cache.extract(),
    },
  };

  return {
    props: {
      query: context.query,
      data,
      error: error || null,
      serverState,
    },
  };
};

const CollectivePage = (props: CollectivePageProps) => {
  useData(props);
  const router = useRouter();
  const { slug, status, step, mode, action } = router.query as CollectivePageQuery;
  const { LoggedInUser } = useLoggedInUser();
  const { data } = useQuery(collectivePageQuery, {
    variables: { slug, nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD },
    fetchPolicy: 'cache-only',
    returnPartialData: true,
  });
  const [fetchData] = useLazyQuery(collectivePageLoggedInUserQuery, {
    variables: { slug },
    fetchPolicy: 'network-only',
  });
  React.useEffect(() => {
    if (LoggedInUser) {
      fetchData();
    }
  }, [LoggedInUser]);
  const [showOnboardingModal, setShowOnboardingModal] = React.useState(true);
  React.useEffect(() => {
    addParentToURLIfMissing(router, data.Collective);
  }, [data.Collective]);

  const collective = data?.Collective;
  if (!data || data.error) {
    return <ErrorPage data={data} />;
  } else if (!data.Collective) {
    return <ErrorPage error={generateNotFoundError(router.query.slug)} log={false} />;
  } else if (data.Collective.isPledged && !data.Collective.isActive) {
    return <PledgedCollectivePage collective={data.Collective} />;
  } else if (data.Collective.isIncognito) {
    return <IncognitoUserCollective collective={data.Collective} />;
  } else if (data.Collective.isGuest) {
    return <GuestUserProfile account={data.Collective} />;
  }

  // Don't allow /collective/apply
  if (action === 'apply' && !collective?.isHost) {
    return <Custom404 />;
  }

  return (
    <Page
      collective={collective}
      canonicalURL={getCollectivePageCanonicalURL(collective)}
      {...getCollectivePageMetadata(collective)}
    >
      <GlobalStyles />
      <React.Fragment>
        <CollectiveNotificationBar
          collective={collective}
          host={collective.host}
          status={status}
          LoggedInUser={LoggedInUser}
          refetch={data.refetch}
        />
        <CollectiveThemeProvider collective={collective}>
          {({ onPrimaryColorChange }) => (
            <CollectivePageContent
              collective={collective}
              host={collective.host}
              coreContributors={collective.coreContributors}
              financialContributors={collective.financialContributors}
              tiers={collective.tiers}
              events={collective.events}
              projects={collective.projects}
              connectedCollectives={collective.connectedCollectives}
              transactions={collective.transactions}
              expenses={collective.expenses}
              stats={collective.stats}
              updates={collective.updates}
              conversations={collective.conversations}
              LoggedInUser={LoggedInUser}
              isAdmin={Boolean(LoggedInUser && LoggedInUser.isAdminOfCollective(collective))}
              isHostAdmin={Boolean(LoggedInUser && LoggedInUser.isHostAdmin(collective))}
              isRoot={Boolean(LoggedInUser && LoggedInUser.isRoot)}
              onPrimaryColorChange={onPrimaryColorChange}
              step={step}
              mode={mode}
              refetch={data.refetch}
            />
          )}
        </CollectiveThemeProvider>
        {mode === 'onboarding' && LoggedInUser?.isAdminOfCollective(collective) && (
          <OnboardingModal
            showOnboardingModal={showOnboardingModal}
            setShowOnboardingModal={setShowOnboardingModal}
            step={step && parseInt(step, 10)}
            mode={mode}
            collective={collective}
            LoggedInUser={LoggedInUser}
          />
        )}
      </React.Fragment>
    </Page>
  );
};

export default CollectivePage;
