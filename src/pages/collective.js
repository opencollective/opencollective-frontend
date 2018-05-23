import React from 'react'
import PropTypes from 'prop-types';
import { addCollectiveData } from '../graphql/queries';
import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';
import withIntl from '../lib/withIntl';
import NotFound from '../components/NotFoundPage';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';

class CollectivePage extends React.Component {

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.object,
    query: PropTypes.object,
  }

  static getInitialProps ({ query }) {
    return { slug: query && query.slug, query }
  }

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
    const { data, query } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    if (!data.Collective) return (<NotFound />);

    const collective = data.Collective;

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

export default withData(withLoggedInUser(addCollectiveData(withIntl(CollectivePage))));
