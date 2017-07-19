import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addUserData, addGetLoggedInUserFunction } from '../graphql/queries';

import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Profile from '../components/Profile';

class ProfilePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({LoggedInUser});
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Event) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const user = data.User;

    if (LoggedInUser) {
      LoggedInUser.canEditUser = LoggedInUser.id === user.id;
    }

    return (
      <div>
        <Profile user={user} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addUserData(withIntl(ProfilePage))));
