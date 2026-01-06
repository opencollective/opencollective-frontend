import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { generateNotFoundError } from '../lib/errors';
import { gql } from '../lib/graphql/helpers';

import CreateProject from '../components/create-project';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const createProjectPageParentAccountQuery = gql`
  query CreateProjectPageParentAccount($slug: String!) {
    account(slug: $slug) {
      id
      type
      slug
      name
      currency
      isFrozen
      ... on AccountWithHost {
        host {
          id
          slug
          name
          features {
            id
            CONTACT_FORM
          }
        }
      }
    }
  }
`;

const CreateProjectPage = ({ loadingLoggedInUser, LoggedInUser }) => {
  const router = useRouter();
  const slug = router.query.parentCollectiveSlug;
  const skipQuery = !LoggedInUser;
  const { loading, error, data } = useQuery(createProjectPageParentAccountQuery, {
    skip: skipQuery,
    variables: { slug },
  });

  if (loading || loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  if (!skipQuery && (!data || !data.account)) {
    return <ErrorPage error={generateNotFoundError(slug)} data={{ error }} log={false} />;
  }

  return (
    <Page showMenuItems={false}>
      <CreateProject parent={data && data.account} />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(CreateProjectPage);
