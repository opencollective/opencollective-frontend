import React from 'react';
import PropTypes from 'prop-types';

import CreateCollective from '../components/create-collective/CreateCollective_v2';
import ErrorPage from '../components/ErrorPage';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class CreateCollectivePage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug } }) {
    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>
    return { slug: hostCollectiveSlug, scripts };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    data: PropTypes.object, // from withData
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data = {}, loadingLoggedInUser } = this.props;

    if (loadingLoggedInUser || data.error) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    console.log(this.props);

    return <CreateCollective host={data.Collective} />;
  }
}

export default withUser(
  addCollectiveCoverData(CreateCollectivePage, {
    skip: props => !props.slug,
  }),
);
