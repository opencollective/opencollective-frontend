import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateCollective from '../components/CreateCollective';
import { addGetLoggedInUserFunction, addCollectiveCoverData } from '../graphql/queries';
<<<<<<< HEAD
import Loading from '../components/Loading';
=======
import ErrorPage from '../components/ErrorPage';
>>>>>>> 6e6a97b454c2713fc599d50ac56b232ac3b1714a

class CreateCollectivePage extends React.Component {

  static getInitialProps ({ query: { hostCollectiveSlug } }) {
<<<<<<< HEAD
    return { slug: hostCollectiveSlug }
=======
    return { slug: hostCollectiveSlug || "opencollective-host" }
>>>>>>> 6e6a97b454c2713fc599d50ac56b232ac3b1714a
  }

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  render() {

    const { data } = this.props;

<<<<<<< HEAD
    if (this.state.loading) {
      return (<Loading />)
=======
    if (this.state.loading || !data.Collective) {
      return (<ErrorPage loading={this.state.loading} data={data} />)
>>>>>>> 6e6a97b454c2713fc599d50ac56b232ac3b1714a
    }

    return (
      <div>
        <CreateCollective host={data.Collective} LoggedInUser={this.state.LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(addCollectiveCoverData(CreateCollectivePage))));
