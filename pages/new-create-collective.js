import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import NewCreateCollective from '../components/create-collective/NewCreateCollective';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';

import { withUser } from '../components/UserProvider';

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

const getHostQuery = gql`
  query Host($slug: String) {
    Collective(slug: $slug) {
      id
      type
      slug
      name
      currency
      settings
      canApply
    }
  }
`;

const addHostData = graphql(getHostQuery, { skip: props => !props.slug });

export default withUser(addHostData(NewCreateCollectivePage));
