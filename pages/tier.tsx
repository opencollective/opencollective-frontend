import React from 'react';
import { get } from 'lodash';
import { useRouter } from 'next/router';

import { initClient } from '../lib/apollo-client';
import { getCollectivePageMetadata } from '../lib/collective.lib';
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
  loading: boolean;
  parentCollectiveSlug: string | null;
  collectiveType: string | null;
  redirect: string | null;
  data: any;
  error: any;
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

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
const TierPage = pageProps => {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const { tierId, tierSlug, data, redirect, error, loading } = pageProps;
  const collective = data?.Tier?.collective;

  React.useEffect(() => {
    if (collective) {
      addParentToURLIfMissing(router, collective, `/contribute/${tierSlug}-${tierId}`);
    }
  }, [collective]);

  return !data || error ? (
    <ErrorPage data={error || data} />
  ) : (
    <Page {...getPageMetaData(pageProps, data)}>
      {loading || !data.Tier || !data.Tier.collective ? (
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
            redirect={redirect}
          />
        </CollectiveThemeProvider>
      )}
    </Page>
  );
};

export const getServerSideProps = async ({
  query: { parentCollectiveSlug, collectiveSlug, tierId, tierSlug, redirect, collectiveType },
}): Promise<{ props: TierPageProps }> => {
  const client = initClient();
  const { data, error, loading } = await client.query({
    query: tierPageQuery,
    variables: { tierId: Number(tierId) },
  });

  return {
    props: {
      // Required
      collectiveSlug,
      tierId: Number(tierId),
      tierSlug,
      loading,
      // Optional must default to `null` (rather than undefined) for serialization
      parentCollectiveSlug: parentCollectiveSlug || null,
      collectiveType: collectiveType || null,
      data: data || null,
      error: error || null,
      redirect: redirect || null,
    },
  };
};

export default TierPage;
