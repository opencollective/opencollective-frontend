import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import memoizeOne from 'memoize-one';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Body from '../components/Body';
import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../components/contribute-cards/Contribute';
import ContributeCollective from '../components/contribute-cards/ContributeCollective';
import ContributeCustom from '../components/contribute-cards/ContributeCustom';
import ContributeEvent from '../components/contribute-cards/ContributeEvent';
import ContributeTier from '../components/contribute-cards/ContributeTier';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import { H2, P } from '../components/Text';
import { withUser } from '../components/UserProvider';

const ContributeCardContainer = styled.div`
  margin: 0 20px 20px 0;
`;

class TiersPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addContributePageData
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
        canonicalURL: `${process.env.WEBSITE_URL}/${collective.slug}/contribute`,
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
                      {!collective.settings.disableCustomContributions && (
                        <ContributeCardContainer>
                          <ContributeCustom
                            hideContributors={!hasContributors}
                            collective={collective}
                            contributors={financialContributorsWithoutTier}
                            stats={collective.stats.backers}
                          />
                        </ContributeCardContainer>
                      )}

                      {collective.tiers.map(tier => (
                        <ContributeCardContainer key={`tier-${tier.id}`} data-cy="contribute-tier">
                          <ContributeTier collective={collective} tier={tier} hideContributors={!hasContributors} />
                        </ContributeCardContainer>
                      ))}

                      {collective.connectedCollectives.map(member => {
                        const childCollective = member.collective;
                        return (
                          <ContributeCardContainer key={member.id}>
                            <ContributeCollective collective={childCollective} />
                          </ContributeCardContainer>
                        );
                      })}

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

const contributePageQuery = gql`
  query ContributePage($slug: String!, $nbContributorsPerContributeCard: Int) {
    Collective(slug: $slug) {
      id
      slug
      path
      name
      type
      currency
      settings
      isActive
      isHost
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
        maxQuantity
        type
        stats {
          id
          totalDonated
          totalRecurringDonations
          availableQuantity
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
      events(includePastEvents: true, includeInactive: true) {
        id
        slug
        name
        description
        image
        isActive
        startsAt
        endsAt
        backgroundImageUrl(height: 208)
        tiers {
          id
          type
        }
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
      connectedCollectives: members(role: "CONNECTED_COLLECTIVE") {
        id
        collective: member {
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
  }
`;

const addContributePageData = graphql(contributePageQuery, {
  options: props => ({
    variables: {
      slug: props.slug,
      nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
    },
  }),
});

export default withUser(addContributePageData(TiersPage));
