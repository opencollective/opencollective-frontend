import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { withRouter } from 'next/router';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import NewContributionFlowSuccess from '../components/new-contribution-flow/ContributionFlowSuccess';
import NewContributionFlowContainer from '../components/new-contribution-flow/index';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

class NewContributionFlowPage extends React.Component {
  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  static propTypes = {
    slug: PropTypes.string.isRequired,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      collective: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  render() {
    const { slug, data, router, LoggedInUser, loadingLoggedInUser } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.collective) {
        return <ErrorPage error={generateNotFoundError(slug, true)} log={false} />;
      }
    }

    const collective = data && data.collective;

    const PageWrapper = ({ children, ...props }) => {
      if (LoggedInUser) {
        return <AuthenticatedPage {...props}>{children}</AuthenticatedPage>;
      } else {
        return <Page {...props}>{children}</Page>;
      }
    };

    return (
      !loadingLoggedInUser && (
        <PageWrapper>
          {data.loading ? (
            <Container py={[5, 6]}>
              <Loading />
            </Container>
          ) : router.query.step === 'success' ? (
            <NewContributionFlowSuccess collective={collective} />
          ) : (
            <NewContributionFlowContainer collective={collective} />
          )}
        </PageWrapper>
      )
    );
  }
}

const getCollectiveInfoQuery = gqlV2`
  query ContributionFlowCollectiveQuery($slug: String) {
    collective(slug: $slug) {
      id
      legacyId
      slug
      type
      name
      currency
      settings
      members {
        nodes {
          id
          role
          account {
            id
            name
            slug
            type
            imageUrl
            orders(filter: OUTGOING, onlySubscriptions: true) {
              totalCount
              nodes {
                id
                totalDonations {
                  value
                  currency
                }
              }
            }
          }
        }
      }
      tiers {
        nodes {
          id
          slug
          name
          interval
          amountType
          presets
          minimumAmount {
            value
          }
        }
      }
    }
  }
`;

const getData = graphql(getCollectiveInfoQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
});

export default getData(withUser(withRouter(NewContributionFlowPage)));
