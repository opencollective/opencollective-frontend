import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import CollectivePage from '../components/collective-page';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class NewCollectivePage extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired, // from withData
    slug: PropTypes.string.isRequired,
  };

  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (get(this.props, 'data.Collective') && !get(newProps, 'data.Collective')) {
      return false;
    } else {
      return true;
    }
  }

  getPageMetaData(collective) {
    if (collective) {
      return {
        title: collective.name,
        description: collective.description || collective.longDescription,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        image: collective.image || get(collective, 'parentCollective.image'),
      };
    } else {
      return {
        title: 'Collective',
        image: '/static/images/defaultBackgroundImage.png',
      };
    }
  }

  render() {
    const { data } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.collective)}>
        {data.loading || !data.Collective ? <Loading /> : <CollectivePage collective={data.Collective} />}
      </Page>
    );
  }
}

const getCollective = graphql(gql`
  query NewCollectivePage($slug: String!) {
    Collective(slug: $slug) {
      id
      slug
      name
      description
      image
      twitterHandle
      githubHandle
      parentCollective {
        id
        image
        twitterHandle
      }
    }
  }
`);

export default withUser(getCollective(withIntl(NewCollectivePage)));
