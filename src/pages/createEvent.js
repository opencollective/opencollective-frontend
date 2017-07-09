import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateEvent from '../components/CreateEvent';
import { addGetLoggedInUserFunction, addCollectiveData } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';

class CreateEventPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    if (LoggedInUser) {
      LoggedInUser.canCreateEvent = Boolean(LoggedInUser.membership);
    }
    this.setState({LoggedInUser, loading: false});
  }

  render() {

    const { data } = this.props;

    if (this.state.loading) {
      return (<Loading />)
    }

    if (!data.loading && !data.Collective) {
      return (<NotFound />)
    }

    return (
      <div>
        <CreateEvent collective={data.Collective} LoggedInUser={this.state.LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(addCollectiveData(CreateEventPage))));
