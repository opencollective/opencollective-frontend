import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/react-hooks';
import { useRouter } from 'next/router';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CreateProject from '../components/create-project';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const createProjectPageParentAccountQuery = gqlV2`
  query CreateProjectPageParentAccount($slug: String!) {
    account(slug: $slug) {
      id
      type
      slug
      name
      currency
    }
  }
`;

const CreateProjectPage = ({ loadingLoggedInUser, LoggedInUser }) => {
  const router = useRouter();
  const slug = router.query.parentCollectiveSlug;
  const skipQuery = !LoggedInUser;
  const { loading, error, data } = useQuery(createProjectPageParentAccountQuery, {
    context: API_V2_CONTEXT,
    skip: skipQuery,
    variables: { slug },
  });

  if (loading || loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  if (!skipQuery && (!data || !data.account)) {
    return <ErrorPage error={generateNotFoundError(slug, true)} data={{ error }} log={false} />;
  }

  return (
    <Page>
      <CreateProject parent={data && data.account} />
    </Page>
  );
};

CreateProjectPage.propTypes = {
  loadingLoggedInUser: PropTypes.bool.isRequired,
  LoggedInUser: PropTypes.object,
};

export default withUser(CreateProjectPage);
