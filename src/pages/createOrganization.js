import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateOrganization from '../components/CreateOrganization';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import { intersection } from 'lodash';

class CreateOrganizationPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { hostCollectiveSlug } }) {
    return { slug: hostCollectiveSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser, slug } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({LoggedInUser, loading: false});
  }

  render() {

    const { data } = this.props;

    if (this.state.loading) {
      return (<Loading />)
    }

    return (
      <div>
        <CreateOrganization LoggedInUser={this.state.LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(CreateOrganizationPage)));
