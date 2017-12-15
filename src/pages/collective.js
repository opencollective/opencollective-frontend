import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addCollectiveData, addGetLoggedInUserFunction } from '../graphql/queries';

import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';
import { intersection } from 'lodash';

class CollectivePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query }) {
    console.log(">>> pages/collective: getInitialProps", query);
    return { slug: query.slug, query }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { data, slug, query, intl } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;
    console.log(">>> pages/collective: collective", collective);
    return (
      <div>
        { collective.type === 'COLLECTIVE' &&
          <Collective
            collective={collective}
            LoggedInUser={LoggedInUser}
            query={query}
            />
        }
        { ['USER', 'ORGANIZATION'].includes(collective.type) &&
          <UserCollective
            collective={collective}
            LoggedInUser={LoggedInUser}
            query={query}
            />
        }
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addCollectiveData(withIntl(CollectivePage))));
