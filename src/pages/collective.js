import React from 'react'
import PropTypes from 'prop-types';
import { addCollectiveData } from '../graphql/queries';
import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';
import withIntl from '../lib/withIntl';
import ErrorPage from '../components/ErrorPage';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';

class CollectivePage extends React.Component {

  static getInitialProps ({ query, res }) {

    if (res){
      res.setHeader('Cache-Control','public, max-age=300');
    }

    return { slug: query && query.slug, query }
  }

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired,
    query: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
    window.OC = window.OC || {};
    window.OC.LoggedInUser = LoggedInUser;
  }

  shouldComponentUpdate(nextProps) {
    // It can be that Apollo is reseting data when navigating from a page to another
    // We try to detect that and prevent rendering
    // This is a workaround and the root cause should be ultimately fixed
    if (this.props.data.Collective && !nextProps.data.Collective) {
      return false;
    }
    return true;
  }

  render() {
    const { data, query } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.Collective) return (<ErrorPage data={data} />);

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
