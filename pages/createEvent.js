import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';

import { legacyCollectiveQuery } from '../lib/graphql/v1/queries';

import CreateEvent from '../components/CreateEvent';
import ErrorPage from '../components/ErrorPage';
import { withUser } from '../components/UserProvider';

class CreateEventPage extends React.Component {
  static getInitialProps({ query: { parentCollectiveSlug } }) {
    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>

    return { slug: parentCollectiveSlug, scripts };
  }

  static propTypes = {
    slug: PropTypes.string, // for addLegacyCollectiveData
    data: PropTypes.object.isRequired, // from withData
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, loadingLoggedInUser } = this.props;

    if (loadingLoggedInUser || !data.Collective) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    return <CreateEvent parentCollective={data.Collective} />;
  }
}

const addLegacyCollectiveData = graphql(legacyCollectiveQuery);

// ignore unused exports default
// next.js export
export default withUser(addLegacyCollectiveData(CreateEventPage));
