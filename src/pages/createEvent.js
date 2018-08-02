import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateEvent from '../components/CreateEvent';
import { addGetLoggedInUserFunction, addCollectiveData } from '../graphql/queries';
import ErrorPage from '../components/ErrorPage';

class CreateEventPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { parentCollectiveSlug } }) {
    return { slug: parentCollectiveSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  render() {

    const { data } = this.props;

    if (this.state.loading || !data.Collective) {
      return (<ErrorPage loading={this.state.loading} data={data} />)
    }

    return (
      <div>
        <CreateEvent parentCollective={data.Collective} LoggedInUser={this.state.LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(addCollectiveData(CreateEventPage))));
