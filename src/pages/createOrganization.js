import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateOrganization from '../components/CreateOrganization';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import ErrorPage from '../components/ErrorPage';

class CreateOrganizationPage extends React.Component {

  static getInitialProps ({ query: { hostCollectiveSlug } }) {
    return { slug: hostCollectiveSlug }
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
    if (this.state.loading) {
      return (<ErrorPage loading />)
    }

    return (
      <div>
        <CreateOrganization LoggedInUser={this.state.LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(CreateOrganizationPage)));
