import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get, throttle } from 'lodash';
import memoizeOne from 'memoize-one';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lighten, darken } from 'polished';

import theme, { generateTheme } from '../lib/constants/theme';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import CollectiveNotificationBar from '../components/collective-page/CollectiveNotificationBar';
import { TransactionsAndExpensesFragment, UpdatesFieldsFragment } from '../components/collective-page/fragments';
import CollectivePage from '../components/collective-page';
import { getCollectivePrimaryColor } from '../components/collective-page/_utils';

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

  state = { newPrimaryColor: null };

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

  getTheme = memoizeOne(primaryColor => {
    if (!primaryColor) {
      return theme;
    } else {
      return generateTheme({
        colors: {
          ...theme.colors,
          primary: {
            800: darken(0.1, primaryColor),
            700: darken(0.05, primaryColor),
            500: primaryColor,
            400: lighten(0.1, primaryColor),
            300: lighten(0.2, primaryColor),
            200: lighten(0.3, primaryColor),
            100: lighten(0.4, primaryColor),
            50: lighten(0.6, primaryColor),
          },
        },
      });
    }
  });

  onPrimaryColorChange = throttle(newPrimaryColor => {
    this.setState({ newPrimaryColor });
  }, 2000);

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
    const primaryColor = this.state.newPrimaryColor || getCollectivePrimaryColor(collective);
    return (
      <Page {...this.getPageMetaData(collective)} withoutGlobalStyles>
        <GlobalStyles />
        <CollectiveNotificationBar collective={collective} host={collective.host} status={status} />
        <ThemeProvider theme={this.getTheme(primaryColor)}>
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
            onPrimaryColorChange={this.onPrimaryColorChange}
          />
        </ThemeProvider>
      </Page>
    );
  }
}

// eslint-disable graphql/template-strings
const getCollective = graphql(gql`
  query NewCollectivePage($slug: String!) {
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
      isArchived
      isHost
      hostFeePercent
      image
      stats {
        id
        balance
        yearlyBudget
        updates
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
        isCore
        isBacker
        isFundraiser
        since
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
      ...TransactionsAndExpensesFragment
      updates(limit: 3, onlyPublishedUpdates: true) {
        ...UpdatesFieldsFragment
      }
    }
  }

  ${TransactionsAndExpensesFragment}
  ${UpdatesFieldsFragment}
`);

export default withUser(getCollective(NewCollectivePage));
