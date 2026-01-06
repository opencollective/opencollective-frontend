import React from 'react';

import CreateFund from '../components/create-fund';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const CreateFundPage = ({ loadingLoggedInUser }) => {
  if (loadingLoggedInUser) {
    return <ErrorPage loading={true} />;
  }

  return (
    <Page showMenuItems={false}>
      <CreateFund />
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(CreateFundPage);
