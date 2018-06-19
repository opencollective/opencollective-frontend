import React from 'react'
import PropTypes from 'prop-types';
import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import Hosts from '../components/Hosts';

class HostsPage extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { LoggedInUser } = this.props;

    return (
      <div>
        <Hosts LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(withLoggedInUser(withIntl(HostsPage)));
