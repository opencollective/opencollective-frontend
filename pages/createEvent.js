import React from 'react';
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

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(addLegacyCollectiveData(CreateEventPage));
