import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';

import AcceptFinancialContributions from '../components/accept-financial-contributions/index.js';
import AuthenticatedPage from '../components/AuthenticatedPage';
import { getCollectivePageQuery } from '../components/collective-page/graphql/queries';
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

const getCollective = graphql(getCollectivePageQuery, {
  options: props => ({
    variables: {
      slug: props.slug,
    },
  }),
});

export default withUser(getCollective(AcceptFinancialContributionsPage));
