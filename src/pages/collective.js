import React from 'react';
import PropTypes from 'prop-types';

import ErrorPage from '../components/ErrorPage';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';
import PledgedCollective from '../components/PledgedCollective';

import { addCollectiveData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class CollectivePage extends React.Component {
  static getInitialProps({ req, res, query }) {
    if (res && req && req.locale == 'en') {
      res.setHeader('Cache-Control', 's-maxage=300');
    }

    return { slug: query && query.slug, query };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveData
    query: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
    window.OC = window.OC || {};
    window.OC.LoggedInUser = LoggedInUser;
  }

  shouldComponentUpdate(nextProps) {
    // It can be that Apollo is resetting data when navigating from a page to another
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

    if (!data.Collective) {
      return <ErrorPage LoggedInUser={LoggedInUser} data={data} />;
    }

    const collective = data.Collective;
    const props = {
      collective,
      LoggedInUser,
      query,
    };

    if (collective && collective.pledges.length > 0 && !collective.isActive) {
      return <PledgedCollective {...props} />;
    }

    if (collective.type === 'COLLECTIVE') {
      return <Collective {...props} />;
    }

    if (['USER', 'ORGANIZATION'].includes(collective.type)) {
      return <UserCollective {...props} />;
    }
  }
}

export default withData(
  withIntl(withLoggedInUser(addCollectiveData(CollectivePage))),
);
