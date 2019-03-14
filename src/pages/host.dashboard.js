import React from 'react';
import PropTypes from 'prop-types';

import { withUser } from '../components/UserProvider';
import HostDashboard from '../components/HostDashboard';
import Loading from '../components/Loading';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import Page from '../components/Page';

class HostExpensesPage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug } }) {
    return { hostCollectiveSlug, ssr: false };
  }

  static propTypes = {
    hostCollectiveSlug: PropTypes.string, // for addData
    ssr: PropTypes.bool,
    data: PropTypes.object, // from withData
    loadingLoggedInUser: PropTypes.bool.isRequired, // from withUser
    LoggedInUser: PropTypes.object, // from withUser
  };

  render() {
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    return (
      <div className="HostExpensesPage">
        {loadingLoggedInUser ? (
          <Page>
            <Loading />
          </Page>
        ) : (
          <HostDashboard hostCollectiveSlug={this.props.hostCollectiveSlug} LoggedInUser={LoggedInUser} />
        )}
      </div>
    );
  }
}

export default withData(withIntl(withUser(HostExpensesPage)));
