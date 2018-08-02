import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addCollectiveToEditData, addGetLoggedInUserFunction } from '../graphql/queries';
import ErrorPage from '../components/ErrorPage';
import EditCollective from '../components/EditCollective';

class EditCollectivePage extends React.Component {

  static getInitialProps ({ query: { slug } }) {
    return { slug, ssr: false };
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
    const { loading, LoggedInUser } = this.state;

    if (loading || !data.Collective) {
      return (<ErrorPage loading={loading} data={data} />)
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
