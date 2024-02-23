import React from 'react';
import PropTypes from 'prop-types';
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

// ignore unused exports getServerSideProps
// next.js export
export const getServerSideProps = tosQueryHelper.getServerSideProps;

const TermsOfFiscalSponsorship = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
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

TermsOfFiscalSponsorship.propTypes = {
  hostCollectiveSlug: PropTypes.string,
};

// ignore unused exports default
// next.js export
export default TermsOfFiscalSponsorship;
