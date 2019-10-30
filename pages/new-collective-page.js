import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { createGlobalStyle } from 'styled-components';
import dynamic from 'next/dynamic';

import { ssrNotFoundError } from '../lib/nextjs_utils';
import { CollectiveType } from '../lib/constants/collectives';
import { Router } from '../server/pages';
import { withUser } from '../components/UserProvider';
import ErrorPage, { generateError } from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../components/contribute-cards/Contribute';
import CollectiveNotificationBar from '../components/collective-page/CollectiveNotificationBar';
import * as fragments from '../components/collective-page/graphql/fragments';
import CollectivePage from '../components/collective-page';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';

/** A page rendered when collective is pledged and not active yet */
const PledgedCollectivePage = dynamic(
  () => import(/* webpackChunkName: 'PledgedCollectivePage' */ '../components/PledgedCollectivePage'),
  { loading: Loading },
);

/** A page rendered when collective is incognito */
const IncognitoUserCollective = dynamic(
  () => import(/* webpackChunkName: 'IncognitoUserCollective' */ '../components/IncognitoUserCollective'),
  { loading: Loading },
);

/** Add global style to enable smooth scroll on the page */
const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }

  section {
    margin: 0;
  }
`;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class NewCollectivePage extends React.Component {
  static getInitialProps({ req, res, query: { slug, status } }) {
    if (res && req && (req.language || req.locale === 'en')) {
      res.set('Cache-Control', 'public, s-maxage=300');
    }
    return { slug, status };
  }

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
        type: PropTypes.string.isRequired,
        description: PropTypes.string,
        twitterHandle: PropTypes.string,
        image: PropTypes.string,
        isApproved: PropTypes.bool,
        isArchived: PropTypes.bool,
        isHost: PropTypes.bool,
        isActive: PropTypes.bool,
        isPledged: PropTypes.bool,
        isIncognito: PropTypes.bool,
        parentCollective: PropTypes.shape({ slug: PropTypes.string, image: PropTypes.string }),
        host: PropTypes.object,
        stats: PropTypes.object,
        coreContributors: PropTypes.arrayOf(PropTypes.object),
        financialContributors: PropTypes.arrayOf(PropTypes.object),
        tiers: PropTypes.arrayOf(PropTypes.object),
        events: PropTypes.arrayOf(PropTypes.object),
        childCollectives: PropTypes.arrayOf(PropTypes.object),
        transactions: PropTypes.arrayOf(PropTypes.object),
        expenses: PropTypes.arrayOf(PropTypes.object),
        updates: PropTypes.arrayOf(PropTypes.object),
      }),
    }).isRequired, // from withData
  };

  componentDidMount() {
    this.redirectIfEvent();
  }

  componentDidUpdate() {
    this.redirectIfEvent();
  }

  /** Will replace the route to redirect to an event if required */
  redirectIfEvent() {
    const { data, slug } = this.props;
    if (get(data, 'Collective.type') === CollectiveType.EVENT) {
      Router.replaceRoute('event', {
        parentCollectiveSlug: get(data.Collective.parentCollective, 'slug', 'collective'),
        eventSlug: slug,
      });
    }
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
    const { slug, data, LoggedInUser, status } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.Collective) {
        ssrNotFoundError(); // Force 404 when rendered server side
        return <ErrorPage error={generateError.notFound(slug)} log={false} />;
      } else if (data.Collective.isPledged && !data.Collective.isActive) {
        return <PledgedCollectivePage collective={data.Collective} />;
      } else if (data.Collective.isIncognito) {
        return <IncognitoUserCollective />;
      }
    }

    const collective = data && data.Collective;
    return (
      <Page {...this.getPageMetaData(collective)} withoutGlobalStyles>
        <GlobalStyles />
        {data.loading ? (
          <Container borderTop="1px solid #E8E9EB" py={[5, 6]}>
            <Loading />
          </Container>
        ) : (
          <React.Fragment>
            <CollectiveNotificationBar collective={collective} host={collective.host} status={status} />
            <CollectiveThemeProvider collective={collective}>
              {({ onPrimaryColorChange }) => (
                <CollectivePage
                  collective={collective}
                  host={collective.host}
                  coreContributors={collective.coreContributors}
                  financialContributors={collective.financialContributors}
                  tiers={collective.tiers}
                  events={collective.events}
                  childCollectives={collective.childCollectives}
                  transactions={collective.transactions}
                  expenses={collective.expenses}
                  stats={collective.stats}
                  updates={collective.updates}
                  LoggedInUser={LoggedInUser}
                  isAdmin={Boolean(LoggedInUser && LoggedInUser.canEditCollective(collective))}
                  isRoot={Boolean(LoggedInUser && LoggedInUser.isRoot())}
                  status={status}
                  onPrimaryColorChange={onPrimaryColorChange}
                />
              )}
            </CollectiveThemeProvider>
          </React.Fragment>
        )}
      </Page>
    );
  }
}

// eslint-disable graphql/template-strings
const getCollective = graphql(
  gql`
    query NewCollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
      Collective(slug: $slug, throwIfMissing: false) {
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
        isActive
        isPledged
        isApproved
        isArchived
        isHost
        isIncognito
        hostFeePercent
        image
        imageUrl
        canApply
        canContact
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
          slug
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
        coreContributors: contributors(roles: [ADMIN, MEMBER]) {
          ...ContributorsFieldsFragment
        }
        financialContributors: contributors(roles: [BACKER], limit: 150) {
          ...ContributorsFieldsFragment
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
          amountType
          endsAt
          type
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
        events(includePastEvents: true) {
          id
          slug
          name
          description
          image
          startsAt
          endsAt
          backgroundImageUrl(height: 208)
          contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER, ATTENDEE]) {
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
        childCollectives {
          id
          slug
          name
          type
          description
          backgroundImageUrl(height: 208)
          stats {
            id
            backers {
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
        ...TransactionsAndExpensesFragment
        updates(limit: 3, onlyPublishedUpdates: true) {
          ...UpdatesFieldsFragment
        }
      }
    }

    ${fragments.TransactionsAndExpensesFragment}
    ${fragments.UpdatesFieldsFragment}
    ${fragments.ContributorsFieldsFragment}
  `,
  {
    options: props => ({
      variables: {
        slug: props.slug,
        nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
      },
    }),
  },
);

export default withUser(getCollective(NewCollectivePage));
