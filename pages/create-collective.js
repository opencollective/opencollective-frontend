import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

import CreateCollective from '../components/create-collective';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const createCollectiveHostQuery = gql`
  query CreateCollectiveHost($slug: String!) {
    host(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      currency
      isOpenToApplications
      termsUrl
      policies {
        id
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
        }
      }
    }
  }
`;

const CreateCollectivePage = ({ loadingLoggedInUser, LoggedInUser }) => {
  const router = useRouter();
  const slug = router.query.hostCollectiveSlug || (router.query.category === 'opensource' ? 'opensource' : undefined);
  const skipQuery = !LoggedInUser || !slug;
  const { loading, error, data } = useQuery(createCollectiveHostQuery, {
    context: API_V2_CONTEXT,
    skip: skipQuery,
    variables: { slug },
  });

  if (loading || loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  if (!skipQuery && (!data || !data.host)) {
    return <ErrorPage error={generateNotFoundError(slug)} data={{ error }} log={false} />;
  }

  return (
    <Page showFooter={Boolean(LoggedInUser)}>
      <CreateCollective host={data && data.host} />
    </Page>
  );
};

CreateCollectivePage.getInitialProps = () => {
  return {
    scripts: { googleMaps: true }, // To enable location autocomplete
  };
};

CreateCollectivePage.propTypes = {
  loadingLoggedInUser: PropTypes.bool.isRequired,
  LoggedInUser: PropTypes.object,
};

// ignore unused exports default
// next.js export
export default withUser(CreateCollectivePage);
