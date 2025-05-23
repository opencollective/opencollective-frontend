import React, { useEffect } from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { createGlobalStyle } from 'styled-components';

import type { Context } from '../lib/apollo-client';
import { APOLLO_ERROR_PROP_NAME, APOLLO_QUERY_DATA_PROP_NAME, getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective';
import { generateNotFoundError } from '../lib/errors';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';
import { getRequestIntl } from '@/lib/i18n/request';
import { getWhitelabelRedirection } from '@/lib/whitelabel';

import CollectivePageContent from '../components/collective-page';
import CollectiveNotificationBar from '../components/collective-page/CollectiveNotificationBar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import { CrowdfundingPreviewBanner } from '../components/crowdfunding-redesign/CrowdfundingPreviewBanner';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';
import { preloadCollectivePageGraphqlQueries } from '@/components/collective-page/graphql/preload';
import { collectivePageQuery } from '@/components/collective-page/graphql/queries';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '@/components/contribute-cards/constants';
import GuestUserProfile from '@/components/GuestUserProfile';
import IncognitoUserCollective from '@/components/IncognitoUserCollective';
import OnboardingModal from '@/components/onboarding-modal/OnboardingModal';

import Custom404 from './404';

const GlobalStyles = createGlobalStyle`
  section {
    margin: 0;
  }
`;

const getVariablesFromContext = ({ query }: Context) => {
  return {
    slug: query.slug,
    nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
  };
};

const getPropsFromContext = (context: Context) => {
  const {
    query: { slug, status, step, mode, action },
  } = context;

  return { slug, status, step, mode, action };
};

const collectivePageQueryHelper = getSSRQueryHelpers<
  ReturnType<typeof getVariablesFromContext>,
  ReturnType<typeof getPropsFromContext>,
  // TODO: Use the query auto-generated type when we move this to V2
  { Collective: { slug: string; id: number; name: string; isHost: boolean; host?: { slug: string } } }
>({
  query: collectivePageQuery,
  getVariablesFromContext,
  getPropsFromContext,
  preload: (client, result) => preloadCollectivePageGraphqlQueries(client, result?.Collective),
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = async (context: Context) => {
  const result = await collectivePageQueryHelper.getServerSideProps(context);
  const props = result['props'];
  const error = props[APOLLO_ERROR_PROP_NAME];
  const data = props[APOLLO_QUERY_DATA_PROP_NAME];
  const notFound = !error && !data?.Collective;

  // Deals with whitelabel redirection from and to the platform
  const redirect = getWhitelabelRedirection(context, data?.Collective);
  if (redirect) {
    context.res?.setHeader('Cache-Control', 'no-cache');
    return {
      redirect: {
        destination: redirect,
        permanent: false,
      },
    };
  }

  if (notFound) {
    return {
      notFound: true,
    };
  }

  if (context.res && context.req) {
    const { locale } = getRequestIntl(context.req);
    if (locale === 'en') {
      context.res.setHeader('Cache-Control', 'public, s-maxage=300');
    }
  }

  return { props };
};

// next.js export
// ts-unused-exports:disable-next-line
export default function CollectivePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { slug, status, step, mode, action, [APOLLO_ERROR_PROP_NAME]: ssrError } = props;
  const [showOnboardingModal, setShowOnboardingModal] = React.useState(mode === 'onboarding');
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const queryResult = collectivePageQueryHelper.useQuery(props);

  const data = queryResult.data;
  const loading = queryResult.loading && !data?.Collective;
  const collective = data?.Collective || data?.previousData?.Collective;

  useEffect(() => {
    addParentToURLIfMissing(router, collective);
  }, [router, collective]);

  if (ssrError) {
    return <ErrorPage data={ssrError} />;
  } else if (!loading) {
    if (!data || queryResult.error) {
      return <ErrorPage data={data} />;
    } else if (!collective || collective.type === 'VENDOR') {
      return <ErrorPage error={generateNotFoundError(slug)} log={false} />;
    } else if (collective.isIncognito) {
      return <IncognitoUserCollective collective={collective} />;
    } else if (collective.isGuest) {
      return <GuestUserProfile account={collective} />;
    }
  }

  // Don't allow /collective/apply
  if (action === 'apply' && collective && !collective.isHost) {
    return <Custom404 />;
  }

  const showCrowdfundingPreviewBanner =
    !['ORGANIZATION', 'FUND', 'INDIVIDUAL', 'USER'].includes(collective?.type) &&
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.CROWDFUNDING_REDESIGN) &&
    LoggedInUser?.isAdminOfCollective(collective) &&
    collective?.isActive;

  return (
    <Page
      collective={collective}
      canonicalURL={getCollectivePageCanonicalURL(collective)}
      {...getCollectivePageMetadata(collective)}
      loading={loading}
    >
      <GlobalStyles />
      {loading ? (
        <div className="py-16 sm:py-32">
          <Loading />
        </div>
      ) : (
        <React.Fragment>
          {showCrowdfundingPreviewBanner && <CrowdfundingPreviewBanner account={collective} />}

          <CollectiveNotificationBar
            collective={collective}
            host={collective.host}
            status={status}
            LoggedInUser={LoggedInUser}
            refetch={queryResult.refetch}
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
                refetch={queryResult.refetch}
              />
            )}
          </CollectiveThemeProvider>
          {mode === 'onboarding' && LoggedInUser?.isAdminOfCollective(collective) && (
            <OnboardingModal
              showOnboardingModal={showOnboardingModal}
              setShowOnboardingModal={setShowOnboardingModal}
              step={step}
              mode={mode}
              collective={collective}
              LoggedInUser={LoggedInUser}
              intl={intl}
            />
          )}
        </React.Fragment>
      )}
    </Page>
  );
}
