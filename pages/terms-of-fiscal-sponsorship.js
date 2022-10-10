import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

const hostTermsQuery = gql`
  query HostTermsQuery($hostCollectiveSlug: String!) {
    host(slug: $hostCollectiveSlug) {
      id
      termsUrl
      isTrustedHost
    }
  }
`;

const TermsOfFiscalSponsorship = ({ hostCollectiveSlug }) => {
  const router = useRouter();
  const { data, loading } = useQuery(hostTermsQuery, {
    variables: { hostCollectiveSlug },
    context: API_V2_CONTEXT,
    skip: !hostCollectiveSlug,
  });

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

export const getServerSideProps = async ({ query }) => {
  return { props: { hostCollectiveSlug: query.hostCollectiveSlug } };
};

TermsOfFiscalSponsorship.propTypes = {
  hostCollectiveSlug: PropTypes.string,
};

export default TermsOfFiscalSponsorship;
