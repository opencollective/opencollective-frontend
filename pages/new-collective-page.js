import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { createGlobalStyle } from 'styled-components';

import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import CollectiveNotificationBar from '../components/collective-page/CollectiveNotificationBar';
import * as fragments from '../components/collective-page/graphql/fragments';
import CollectivePage from '../components/collective-page';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';

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
    slug: PropTypes.string.isRequired, // from getInitialProps
    /** A special status to show the notification bar (collective created, archived...etc) */
    status: PropTypes.oneOf(['collectiveCreated', 'collectiveArchived']),
    LoggedInUser: PropTypes.object, // from withUser
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      Collective: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        twitterHandle: PropTypes.string,
        image: PropTypes.string,
        isApproved: PropTypes.bool,
        isArchived: PropTypes.bool,
        isHost: PropTypes.bool,
        parentCollective: PropTypes.shape({ image: PropTypes.string }),
        host: PropTypes.object,
        stats: PropTypes.object,
        contributors: PropTypes.arrayOf(PropTypes.object),
        tiers: PropTypes.arrayOf(PropTypes.object),
        events: PropTypes.arrayOf(PropTypes.object),
        transactions: PropTypes.arrayOf(PropTypes.object),
        expenses: PropTypes.arrayOf(PropTypes.object),
        updates: PropTypes.arrayOf(PropTypes.object),
      }),
    }).isRequired, // from withData
  };

  static getInitialProps({ query: { slug, status } }) {
    return { slug, status };
  }

  getPageMetaData(collective) {
    if (collective) {
      return {
        title: collective.name,
        description: collective.description,
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
    const { data, LoggedInUser, status } = this.props;

    if (!data || data.error) {
      return <ErrorPage data={data} />;
    } else if (data.loading || !data.Collective) {
      return (
        <Page {...this.getPageMetaData()} withoutGlobalStyles>
          <Loading />
        </Page>
      );
    }

    const collective = data.Collective;
    const isAdmin = Boolean(LoggedInUser && LoggedInUser.canEditCollective(collective));
    return (
      <Page {...this.getPageMetaData(collective)} withoutGlobalStyles>
        <GlobalStyles />
        <CollectiveNotificationBar collective={collective} host={collective.host} status={status} />
        <CollectiveThemeProvider collective={collective}>
          {({ onPrimaryColorChange }) => (
            <CollectivePage
              collective={collective}
              host={collective.host}
              contributors={collective.contributors}
              tiers={collective.tiers}
              events={collective.events}
              transactions={collective.transactions}
              expenses={collective.expenses}
              stats={collective.stats}
              updates={collective.updates}
              LoggedInUser={LoggedInUser}
              isAdmin={isAdmin}
              status={status}
              onPrimaryColorChange={onPrimaryColorChange}
            />
          )}
        </CollectiveThemeProvider>
      </Page>
    );
  }
}

// eslint-disable graphql/template-strings
const getCollective = graphql(gql`
  query NewCollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
    Collective(slug: $slug) {
      id
      slug
      path
      name
      description
      longDescription
      backgroundImage
      twitterHandle
      githubHandle
      website
      tags
      company
      type
      currency
      settings
      isApproved
      isArchived
      isHost
      hostFeePercent
      image
      imageUrl
      stats {
        id
        balance
        yearlyBudget
        updates
        backers {
          id
          all
          users
          organizations
        }
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
        type
      }
      contributors {
        id
        name
        roles
        isAdmin
        isCore
        isBacker
        isFundraiser
        since
        image
        description
        collectiveSlug
        totalAmountDonated
        type
        publicMessage
        isIncognito
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
        button
        stats {
          id
          totalDonated
          totalRecurringDonations
          contributors {
            id
            all
            users
            organizations
          }
        }
        contributors(limit: $nbContributorsPerContributeCard) {
          id
          image
          collectiveSlug
          name
          type
        }
      }
      events {
        id
        slug
        name
        description
        image
        contributors(limit: $nbContributorsPerContributeCard) {
          id
          image
          collectiveSlug
          name
          type
        }
        stats {
          id
          backers {
            id
            all
            users
            organizations
          }
        }
      }
      ...TransactionsAndExpensesFragment
      updates(limit: 3, onlyPublishedUpdates: true) {
        ...UpdatesFieldsFragment
      }
    }
  }

  ${fragments.TransactionsAndExpensesFragment}
  ${fragments.UpdatesFieldsFragment}
`);

export default withUser(getCollective(NewCollectivePage));
