import React from 'react';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

import Loading from '../components/Loading';

const hostTermsQuery = gql`
  query HostTerms($hostCollectiveSlug: String!) {
    host(slug: $hostCollectiveSlug) {
      id
      termsUrl
      isTrustedHost
    }
  }
`;

const getVariablesFromContext = context => ({ hostCollectiveSlug: context.query.hostCollectiveSlug as string });

const tosQueryHelper = getSSRQueryHelpers<ReturnType<typeof getVariablesFromContext>>({
  query: hostTermsQuery,
  context: API_V2_CONTEXT,
  skipClientIfSSRThrows404: true,
  getVariablesFromContext,
});

// next.js export
// ts-unused-exports:disable-next-line
export const getServerSideProps = tosQueryHelper.getServerSideProps;

interface TermsOfFiscalSponsorshipProps {
  hostCollectiveSlug?: string;
}

const TermsOfFiscalSponsorship = (props: TermsOfFiscalSponsorshipProps) => {
  const router = useRouter();
  const { data, loading } = tosQueryHelper.useQuery(props);

  React.useEffect(() => {
    const termsOfService = data?.host?.termsUrl;
    const isTrustedHost = data?.host?.isTrustedHost;
    if (termsOfService) {
      if (isTrustedHost) {
        router.push(termsOfService);
      } else {
        router.push({ pathname: '/external-redirect', query: { url: termsOfService } });
      }
    }
  }, [router, loading, data]);

  return (
    <div className="p-32 text-center">
      <Loading />
    </div>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default TermsOfFiscalSponsorship;
