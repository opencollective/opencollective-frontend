import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { createGlobalStyle } from 'styled-components';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import CollectivePage from '../components/collective-page';

/** Add global style to enable smooth scroll on the page */
const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
`;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class NewCollectivePage extends React.Component {
  static propTypes = {
    slug: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
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
    const { data, LoggedInUser } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.collective)}>
        {data.loading || !data.Collective ? (
          <Loading />
        ) : (
          <React.Fragment>
            <GlobalStyles />
            <CollectivePage
              collective={data.Collective}
              host={data.Collective.host}
              contributors={data.Collective.contributors}
              tiers={data.Collective.tiers}
              events={data.Collective.events}
              topOrganizations={data.Collective.topOrganizations}
              topIndividuals={data.Collective.topIndividuals}
              transactions={data.Collective.transactions}
              expenses={data.Collective.expenses}
              stats={data.Collective.stats}
              LoggedInUser={LoggedInUser}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

const MemberFields = gql`
  fragment MemberFields on Member {
    id
    since
    role
    collective: member {
      id
      name
      image
      slug
      type
    }
    stats {
      id
      totalDonations
    }
  }
`;

const getCollective = graphql(gql`
  query NewCollectivePage($slug: String!) {
    Collective(slug: $slug) {
      id
      slug
      name
      description
      longDescription
      image
      backgroundImage
      twitterHandle
      githubHandle
      website
      tags
      type
      currency
      settings
      stats {
        balance
        yearlyBudget
      }
      parentCollective {
        id
        image
        twitterHandle
        type
      }
      host {
        id
        name
        slug
        image
        type
      }
      contributors {
        id
        name
        roles
        isCore
        isBacker
        isFundraiser
        since
        description
        collectiveSlug
        totalAmountDonated
        image
      }
      topOrganizations: members(role: "BACKER", type: "ORGANIZATION", limit: 10) {
        ...MemberFields
      }
      topIndividuals: members(role: "BACKER", type: "USER", limit: 10) {
        ...MemberFields
      }
      tiers {
        id
        name
        slug
        description
        hasLongDescription
        goal
        interval
        currency
        amount
        minimumAmount
        stats {
          id
          totalDonated
          totalRecurringDonations
        }
      }
      events {
        id
        slug
        name
        description
        image
      }
      transactions(limit: 3) {
        id
        netAmountInCollectiveCurrency
        description
        type
        createdAt
        fromCollective {
          id
          slug
          name
          image
        }
        usingVirtualCardFromCollective {
          id
          slug
          name
        }
      }
      expenses(limit: 3) {
        id
        amount
        description
        createdAt
        category
        transaction {
          id
        }
        fromCollective {
          id
          slug
          name
          image
        }
      }
    }
  }

  ${MemberFields}
`);

export default withUser(getCollective(withIntl(NewCollectivePage)));
