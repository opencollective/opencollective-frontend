import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';

import AcceptFinancialContributions from '../components/accept-financial-contributions/index.js';
import AuthenticatedPage from '../components/AuthenticatedPage';
import { collectivePageQuery } from '../components/collective-page/graphql/queries';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import { withUser } from '../components/UserProvider';

class AcceptFinancialContributionsPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      slug: query.slug,
    };
  }

  static propTypes = {
    slug: PropTypes.string,
    data: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { data } = this.props;

    if (!data.loading && (!data || data.error)) {
      return <ErrorPage data={data} />;
    }

    const collective = data && data.Collective;
    return (
      <AuthenticatedPage>
        {data.loading ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : (
          <AcceptFinancialContributions collective={collective} />
        )}
      </AuthenticatedPage>
    );
  }
}

const addCollectivePageData = graphql(collectivePageQuery, {
  options: props => ({
    variables: { slug: props.slug },
  }),
});

// ignore unused exports default
// next.js export
export default withUser(addCollectivePageData(AcceptFinancialContributionsPage));
