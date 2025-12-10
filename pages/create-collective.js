import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { generateNotFoundError } from '../lib/errors';
import { gql } from '../lib/graphql/helpers';
import { isHiddenAccount } from '@/lib/collective';

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
      isSuspended
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
    skip: skipQuery,
    variables: { slug },
  });

  if (loading || loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  if (!skipQuery && (!data || !data.host || isHiddenAccount(data.host))) {
    return <ErrorPage error={generateNotFoundError(slug)} data={{ error }} log={false} />;
  }

  return (
    <Page showFooter={Boolean(LoggedInUser)} showMenuItems={false}>
      <CreateCollective host={data && data.host} />
    </Page>
  );
};

CreateCollectivePage.getInitialProps = () => {
  return {
    scripts: { googleMaps: true }, // To enable location autocomplete
  };
};

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(CreateCollectivePage);
