import React from 'react';
import PropTypes from 'prop-types';
import NewCreateCollective from '../components/create-collective/NewCreateCollective';
import ErrorPage from '../components/ErrorPage';
import { addCollectiveCoverData } from '../lib/graphql/queries';
import { withUser } from '../components/UserProvider';

import Page from '../components/Page';

class NewCreateCollectivePage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      query,
      slug: query && query.hostCollectiveSlug,
    };
  }

  static propTypes = {
    query: PropTypes.object,
    slug: PropTypes.string, // for addCollectiveCoverData
    data: PropTypes.object, // from withData
    loadingLoggedInUser: PropTypes.bool,
  };

  render() {
    const { data = {}, loadingLoggedInUser, query } = this.props;

    if (loadingLoggedInUser || data.error) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    return (
      <Page>
        <NewCreateCollective host={data.Collective} query={query} />
      </Page>
    );
  }
}

export default withUser(
  addCollectiveCoverData(NewCreateCollectivePage, {
    skip: props => !props.slug,
  }),
);
