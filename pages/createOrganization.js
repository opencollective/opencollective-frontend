import React from 'react';
import PropTypes from 'prop-types';

import CreateOrganization from '../components/CreateOrganization';
import ErrorPage from '../components/ErrorPage';

import { withUser } from '../components/UserProvider';

class CreateOrganizationPage extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    refetchLoggedInUser: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, refetchLoggedInUser } = this.props;

    if (loadingLoggedInUser) {
      return <ErrorPage loading />;
    }

    return (
      <div>
        <CreateOrganization LoggedInUser={LoggedInUser} refetchLoggedInUser={refetchLoggedInUser} />
      </div>
    );
  }
}

export default withUser(CreateOrganizationPage);
