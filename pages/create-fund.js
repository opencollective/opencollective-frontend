import React from 'react';
import PropTypes from 'prop-types';

import CreateFund from '../components/create-fund';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const CreateFundPage = ({ loadingLoggedInUser, LoggedInUser }) => {
  if (loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  return (
    <Page title={LoggedInUser ? null : 'Open Collective - Sign In'}>
      <CreateFund />
    </Page>
  );
};

CreateFundPage.propTypes = {
  loadingLoggedInUser: PropTypes.bool.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
};

export default withUser(CreateFundPage);
