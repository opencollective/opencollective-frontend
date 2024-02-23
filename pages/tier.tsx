import React from 'react';
import { get } from 'lodash';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective';
import { CollectiveType } from '../lib/constants/collectives';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../lib/url-helpers';
import { getWebsiteUrl } from '../lib/utils';

import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';
import TierPageContent from '../components/tier-page';
import { tierPageQuery } from '../components/tier-page/graphql/queries';

type TierPageProps = {
  collectiveSlug: string;
  tierId: number;
  tierSlug: string;
  parentCollectiveSlug: string | null;
  collectiveType: string | null;
  redirect: string | string[] | null;
};

const getPageMetaData = (pageProps: TierPageProps, data) => {
  let canonicalURL;
  const tier = data?.Tier;
  const collective = tier?.collective;
  const baseMetadata = getCollectivePageMetadata();
  const { collectiveType, collectiveSlug, parentCollectiveSlug, tierId, tierSlug } = pageProps;

  if (collective) {
    const collective = tier.collective;
    canonicalURL = `${getWebsiteUrl()}${getCollectivePageRoute(collective)}/contribute/${tier.slug}-${tier.id}`;
    return {
      ...baseMetadata,
      title: `${collective.name} - ${tier.name}`,
      description: tier.description || collective.description || collective.longDescription,
      twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
      canonicalURL,
    };
  } else if ([CollectiveType.EVENT, CollectiveType.PROJECT].includes(collectiveType)) {
    canonicalURL = `${getWebsiteUrl()}/${parentCollectiveSlug}/${collectiveType}/${collectiveSlug}/contribute/${tierSlug}-${tierId}`;
  } else {
    canonicalURL = `${getWebsiteUrl()}/${collectiveSlug}/contribute/${tierSlug}-${tierId}`;
  }

  return { ...baseMetadata, title: 'Tier', canonicalURL };
};

const tierPageQueryHelpers = getSSRQueryHelpers<{ tierId: number }, TierPageProps>({
  query: tierPageQuery,
  getVariablesFromContext: ({ query: { tierId } }) => ({ tierId: Number(tierId) }),
  getPropsFromContext: ({
    query: { parentCollectiveSlug, collectiveSlug, tierId, tierSlug, redirect, collectiveType },
  }) => ({
    // Required
    collectiveSlug: collectiveSlug as string,
    tierId: Number(tierId),
    tierSlug: tierSlug as string,
    // Optional must default to `null` (rather than undefined) for serialization
    parentCollectiveSlug: (parentCollectiveSlug as string) || null,
    collectiveType: (collectiveType as string) || null,
    redirect: redirect || null,
  }),
});

// ignore unused exports getServerSideProps
// next.js export
export const getServerSideProps = tierPageQueryHelpers.getServerSideProps;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
const TierPage = (pageProps: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const { collectiveSlug, tierId, tierSlug, redirect } = pageProps;
  const { data, error, loading } = tierPageQueryHelpers.useQuery(pageProps);
  const collective = data?.Tier?.collective;

  React.useEffect(() => {
    if (collective) {
      addParentToURLIfMissing(router, collective, `/contribute/${tierSlug}-${tierId}`);
    }
  }, [collective]);

  if (!loading) {
    if (error) {
      return <ErrorPage data={data} error={error} />;
    } else if (!data?.Tier || !collective || collectiveSlug !== collective.slug) {
      return <ErrorPage data={data} error={{ type: 'NOT_FOUND' }} />;
    }
  }

  return (
    <Page collective={collective} {...getPageMetaData(pageProps, data)}>
      {loading ? (
        <div className="py-16 sm:py-32">
          <Loading />
        </div>
      ) : (
        <CollectiveThemeProvider collective={data.Tier.collective}>
          <TierPageContent
            LoggedInUser={LoggedInUser}
            collective={data.Tier.collective}
            tier={data.Tier}
            contributors={data.Tier.contributors}
            contributorsStats={data.Tier.stats.contributors}
            redirect={Array.isArray(redirect) ? redirect[0] : redirect}
          />
        </CollectiveThemeProvider>
      )}
    </Page>
  );
};

// ignore unused exports default
// next.js export
export default TierPage;
