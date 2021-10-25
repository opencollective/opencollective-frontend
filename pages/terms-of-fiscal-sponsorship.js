import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

const hostTermsQuery = gqlV2/* GraphQL */ `
  query HostTermsQuery($hostCollectiveSlug: String!) {
    host(slug: $hostCollectiveSlug) {
      id
      settings
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

  const termsOfService = data?.host?.settings?.tos;
  const isTrustedHost = data?.host?.isTrustedHost;

  if (!loading && termsOfService) {
    if (isTrustedHost) {
      router.push(data.host.settings.tos);
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
