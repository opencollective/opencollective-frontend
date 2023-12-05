import PropTypes from 'prop-types';
import { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

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
  getVariablesFromContext,
});

export const getServerSideProps = tosQueryHelper.getServerSideProps;

const TermsOfFiscalSponsorship = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data, loading } = tosQueryHelper.useQuery(props);
  const termsOfService = data?.host?.termsUrl;
  const isTrustedHost = data?.host?.isTrustedHost;

  if (!loading && termsOfService) {
    if (isTrustedHost) {
      router.push(termsOfService);
    } else {
      router.push({ pathname: '/external-redirect', query: { url: termsOfService } });
    }
  }

  return null;
};

TermsOfFiscalSponsorship.propTypes = {
  hostCollectiveSlug: PropTypes.string,
};

export default TermsOfFiscalSponsorship;
