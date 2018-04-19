import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addCollectiveToEditData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFoundPage';
import Loading from '../components/Loading';
import EditCollective from '../components/EditCollective';

class EditCollectivePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { slug } }) {
    return { slug, ssr: false };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  render() {
    const { data } = this.props;
    const { loading, LoggedInUser } = this.state;
    if (loading || data.loading) {
      return <Loading />;
    }

    if (!data.Collective) {
      return (<NotFound />)
    }

    const collective = data.Collective;

    window.OC = { collective };

    return (
      <div>
        <EditCollective collective={collective} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addCollectiveToEditData(withIntl(EditCollectivePage))));
