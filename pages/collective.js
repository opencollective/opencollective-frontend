import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import ErrorPage from '../components/ErrorPage';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';
import IncognitoUserCollective from '../components/IncognitoUserCollective';
import PledgedCollectivePage from '../components/PledgedCollectivePage';

import { addCollectiveData } from '../lib/graphql/queries';

import { ssrNotFoundError } from '../lib/nextjs_utils';
import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import Page from '../components/Page';

class CollectivePage extends React.Component {
  static getInitialProps({ req, res, query }) {
    if (res && req && (req.language || req.locale === 'en')) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    }

    return { slug: query && query.slug, query };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveData
    query: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    const Collective = get(this.props.data, 'Collective') || this.state.collective;
    this.setState({ Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { query, LoggedInUser, data } = this.props;
    const collective = get(data, 'Collective') || this.state.Collective;

    if (!data.loading && !collective) {
      ssrNotFoundError(data);
    } else if (data.loading && !collective) {
      return (
        <Page>
          <Loading />
        </Page>
      );
    }

    const props = {
      collective,
      LoggedInUser,
      query,
    };

    if (collective && collective.isPledged && !collective.isActive) {
      return <PledgedCollectivePage collective={collective} />;
    }

    if (collective && collective.type === 'COLLECTIVE') {
      return <Collective {...props} />;
    }

    if (collective && ['USER', 'ORGANIZATION'].includes(collective.type)) {
      if (collective.isIncognito && (!LoggedInUser || !LoggedInUser.canEditCollective(collective))) {
        return <IncognitoUserCollective {...props} />;
      } else {
        return <UserCollective {...props} />;
      }
    }

    return <ErrorPage LoggedInUser={LoggedInUser} data={data} />;
  }
}

export default withUser(addCollectiveData(CollectivePage));
