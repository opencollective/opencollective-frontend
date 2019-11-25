import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import memoizeOne from 'memoize-one';

import Header from '../components/Header';
import Body from '../components/Body';
import Container from '../components/Container';
import Footer from '../components/Footer';
import CollectiveNavbar from '../components/CollectiveNavbar';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import { withUser } from '../components/UserProvider';
import { H2, P } from '../components/Text';
import MessageBox from '../components/MessageBox';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import { Sections } from '../components/collective-page/_constants';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../components/contribute-cards/Contribute';
import ContributeCustom from '../components/contribute-cards/ContributeCustom';
import ContributeTier from '../components/contribute-cards/ContributeTier';
import ContributeEvent from '../components/contribute-cards/ContributeEvent';
import ContributeCollective from '../components/contribute-cards/ContributeCollective';

const ContributeCardContainer = styled.div`
  margin: 0 20px 20px 0;
`;

class TiersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveData
    query: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  getFinancialContributorsWithoutTier = memoizeOne(contributors => {
    return contributors.filter(c => c.isBacker && (c.tiersIds.length === 0 || c.tiersIds[0] === null));
  });

  hasContributors = memoizeOne((contributors, events) => {
    const hasFinancial = contributors.find(c => c.isBacker);
    return hasFinancial || events.find(event => event.contributors.length > 0);
  });

  getPageMetadata(collective) {
    if (!collective) {
      return { title: 'Contribute', description: 'All the ways to contribute' };
    } else {
      return {
        title: `Contribute to ${collective.name}`,
        description: 'These are all the ways you can help make our community sustainable. ',
        canonicalURL: `/${collective.slug}/contribute`,
      };
    }
  }

  render() {
    const { LoggedInUser, data = {} } = this.props;

    if (!data || !data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const canContribute = collective.isActive && collective.host;
    const financialContributorsWithoutTier = this.getFinancialContributorsWithoutTier(collective.contributors);
    const hasContributors = this.hasContributors(collective.contributors, collective.events);

    return (
      <div>
        <Header LoggedInUser={LoggedInUser} {...this.getPageMetadata(collective)} />
        <Body>
          {data.loading ? (
            <Loading />
          ) : (
            <CollectiveThemeProvider collective={data.Collective}>
              <Container pb={3}>
                <CollectiveNavbar collective={collective} selected={Sections.CONTRIBUTE} />
                <Container maxWidth={1260} my={5} px={[15, 30]} mx="auto">
                  <H2 fontWeight="normal" my={4}>
                    <FormattedMessage id="CP.Contribute.Title" defaultMessage="Become a contributor" />
                  </H2>
                  <P color="black.700" mb={4}>
                    <FormattedMessage
                      id="ContributePage.Description"
                      defaultMessage="These are all the ways you can help make our community sustainable. "
                    />
                  </P>
                  {canContribute ? (
                    <Container display="flex" flexWrap="wrap">
                      <ContributeCardContainer>
                        <ContributeCustom
                          hideContributors={!hasContributors}
                          collective={collective}
                          contributors={financialContributorsWithoutTier}
                          stats={collective.stats.backers}
                        />
                      </ContributeCardContainer>

                      {collective.tiers.map(tier => (
                        <ContributeCardContainer key={`tier-${tier.id}`} data-cy="contribute-tier">
                          <ContributeTier collective={collective} tier={tier} hideContributors={!hasContributors} />
                        </ContributeCardContainer>
                      ))}

                      {collective.childCollectives.map(childCollective => (
                        <ContributeCardContainer key={childCollective.id}>
                          <ContributeCollective collective={childCollective} />
                        </ContributeCardContainer>
                      ))}

                      {collective.events.map(event => (
                        <ContributeCardContainer key={`event-${event.id}`}>
                          <ContributeEvent collective={collective} event={event} hideContributors={!hasContributors} />
                        </ContributeCardContainer>
                      ))}
                    </Container>
                  ) : (
                    <MessageBox type="info" withIcon>
                      <FormattedMessage
                        id="ContributePage.Inactive"
                        defaultMessage="This collective can't accept financial contributions at the moment."
                      />
                    </MessageBox>
                  )}
                </Container>
              </Container>
            </CollectiveThemeProvider>
          )}
        </Body>
        <Footer />
      </div>
    );
  }
}

const addTiersData = graphql(
  gql`
    query NewCollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
      Collective(slug: $slug) {
        id
        slug
        path
        name
        type
        currency
        settings
        isActive
        imageUrl
        host {
          id
          name
          slug
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
        contributors {
          id
          name
          roles
          isAdmin
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
          tiersIds
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
      }
    }
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

export default withUser(addTiersData(TiersPage));
