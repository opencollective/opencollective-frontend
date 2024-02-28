import React from 'react';
import PropTypes from 'prop-types';

import CreateFund from '../components/create-fund';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const CreateFundPage = ({ loadingLoggedInUser }) => {
  if (loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  return (
    <Page>
      <CreateFund />
    </Page>
  );
};

CreateFundPage.propTypes = {
  loadingLoggedInUser: PropTypes.bool.isRequired,
};

// ignore unused exports default
// next.js export
export default withUser(CreateFundPage);
