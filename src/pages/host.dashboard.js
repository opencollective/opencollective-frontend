import React from 'react';
import PropTypes from 'prop-types';

import { withUser } from '../components/UserProvider';
import HostDashboard from '../components/HostDashboard';
import Loading from '../components/Loading';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';

class HostExpensesPage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug } }) {
    return { hostCollectiveSlug, ssr: false };
  }

  static propTypes = {
    hostCollectiveSlug: PropTypes.string, // for addData
    ssr: PropTypes.bool,
    data: PropTypes.object, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  render() {
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    return (
      <div className="HostExpensesPage">
        {loadingLoggedInUser ? (
          <Loading />
        ) : (
          <HostDashboard hostCollectiveSlug={this.props.hostCollectiveSlug} LoggedInUser={LoggedInUser} />
        )}
      </div>
    );
  }
}

export default withData(withIntl(withUser(HostExpensesPage)));
