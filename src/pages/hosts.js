import React from 'react'
import PropTypes from 'prop-types';
import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import Hosts from '../components/Hosts';

class HostsPage extends React.Component {

  static propTypes = {
    getLoggedInUser: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { LoggedInUser } = this.state;

    return (
      <div>
        <Hosts LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(withLoggedInUser(withIntl(HostsPage)));
