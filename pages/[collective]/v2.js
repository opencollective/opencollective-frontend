import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { createGlobalStyle } from 'styled-components';

import { withUser } from '../../components/UserProvider';
import ErrorPage from '../../components/ErrorPage';
import Page from '../../components/Page';
import Loading from '../../components/Loading';
import CollectivePage from '../../components/collective-page';
import CollectiveNotificationBar from '../../components/collective-page/CollectiveNotificationBar';
import { TransactionsAndExpensesFragment, UpdatesFieldsFragment } from '../../components/collective-page/fragments';

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
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
  };

  static getInitialProps({ query: { collective, status } }) {
    return { slug: collective, status };
  }

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (get(this.props, 'data.Collective') && !get(newProps, 'data.Collective')) {
      console.warn('Collective lost from props (#1872)');
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
    const { data, LoggedInUser, status } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.collective)} withoutGlobalStyles>
        {data.loading || !data.Collective ? (
          <Loading />
        ) : (
          <React.Fragment>
            <GlobalStyles />
            <CollectiveNotificationBar collective={data.Collective} host={data.Collective.host} status={status} />
            <CollectivePage
              collective={data.Collective}
              host={data.Collective.host}
              contributors={data.Collective.contributors}
              tiers={data.Collective.tiers}
              events={data.Collective.events}
              transactions={data.Collective.transactions}
              expenses={data.Collective.expenses}
              stats={data.Collective.stats}
              updates={data.Collective.updates}
              status={status}
              LoggedInUser={LoggedInUser}
            />
          </React.Fragment>
        )}
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
      type
      currency
      settings
      isArchived
      stats {
        id
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
