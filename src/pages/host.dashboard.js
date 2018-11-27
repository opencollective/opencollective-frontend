import React from 'react';
import PropTypes from 'prop-types';

import HostDashboard from '../components/HostDashboard';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

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

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { LoggedInUser } = this.state;

    return (
      <div className="HostExpensesPage">
        {LoggedInUser && (
          <HostDashboard
            hostCollectiveSlug={this.props.hostCollectiveSlug}
            LoggedInUser={LoggedInUser}
          />
        )}
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(HostExpensesPage)));
