import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';

import { API_V1_CONTEXT } from '../lib/graphql/helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import { collectivePageQuery } from '../components/collective-page/graphql/queries';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import { withUser } from '../components/UserProvider';
import AcceptContributionsThroughAFiscalHost from '@/components/accept-financial-contributions/AcceptContributionsThroughAFiscalHost';
import { SuccessPage } from '@/components/accept-financial-contributions/SuccessPage';

class AcceptFinancialContributionsPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      slug: query.slug,
      state: query.state,
      hostSlug: query.hostSlug,
    };
  }

  static propTypes = {
    slug: PropTypes.string,
    data: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
  };

  render() {
    const { data, state, hostSlug } = this.props;

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
        ) : state === 'success' ? (
          <SuccessPage collective={collective} hostSlug={hostSlug} />
        ) : (
          <AcceptContributionsThroughAFiscalHost collective={collective} />
        )}
      </AuthenticatedPage>
    );
  }
}

const addCollectivePageData = graphql(collectivePageQuery, {
  options: props => ({
    context: API_V1_CONTEXT,
    variables: { slug: props.slug },
  }),
});

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(addCollectivePageData(AcceptFinancialContributionsPage));
