import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import memoizeOne from 'memoize-one';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';

import { Dimensions } from '../_constants';
import Container from '../../Container';
import { Box, Flex, Grid } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledFilters from '../../StyledFilters';
import { fadeIn } from '../../StyledKeyframes';
import StyledMembershipCard from '../../StyledMembershipCard';
import { H3, P } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

import EmptyCollectivesSectionImageSVG from '../images/EmptyCollectivesSectionImage.svg';

const FILTERS = {
  ALL: 'ALL',
  HOSTED_COLLECTIVES: 'HOST',
  HOSTED_EVENTS: 'EVENT',
  CORE: 'CORE',
  FINANCIAL: 'FINANCIAL',
  EVENTS: 'EVENTS',
};
const FILTERS_LIST = Object.values(FILTERS);
const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'SectionContributions.All',
    defaultMessage: 'All Contributions',
  },
  [FILTERS.HOSTED_COLLECTIVES]: {
    id: 'HostedCollectives',
    defaultMessage: 'Hosted Collectives',
  },
  [FILTERS.HOSTED_EVENTS]: {
    id: 'HostedEvents',
    defaultMessage: 'Hosted Events',
  },
  [FILTERS.FINANCIAL]: {
    id: 'Member.Role.BACKER',
    defaultMessage: 'Financial Contributor',
  },
  [FILTERS.CORE]: {
    id: 'Member.Role.MEMBER',
    defaultMessage: 'Core Contributor',
  },
  [FILTERS.EVENTS]: {
    id: 'Events',
    defaultMessage: 'Events',
  },
});

const ROLES_WEIGHT = {
  [roles.FUNDRAISER]: 1,
  [roles.MEMBER]: 2,
  [roles.BACKER]: 3,
  [roles.CONTRIBUTOR]: 4,
  [roles.ADMIN]: 5,
  [roles.HOST]: 6,
};

/** All filters except `ALL` */
const filterFuncs = {
  [FILTERS.HOSTED_COLLECTIVES]: ({ role, collective }) => role === roles.HOST && collective.type === 'COLLECTIVE',
  [FILTERS.HOSTED_EVENTS]: ({ role, collective }) => role === roles.HOST && collective.type === 'EVENT',
  [FILTERS.FINANCIAL]: ({ role, stats }) => role === roles.BACKER && stats.totalDonations > 0,
  [FILTERS.CORE]: ({ role }) => role === roles.ADMIN || role === roles.MEMBER,
  [FILTERS.EVENTS]: ({ role }) => role === roles.ATTENDEE,
};

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fill, minmax(220px, 1fr))';

/** A container for membership cards to ensure we have a smooth transition */
const MembershipCardContainer = styled.div`
  animation: ${fadeIn} 0.2s;
`;

class SectionContributions extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        backers: PropTypes.shape({
          all: PropTypes.number,
        }),
      }).isRequired,
    }).isRequired,

    /** @ignore from withData */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Collective: PropTypes.shape({
        stats: PropTypes.shape({
          collectives: PropTypes.shape({
            hosted: PropTypes.number,
          }).isRequired,
        }).isRequired,
        connectedCollectives: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number,
            collective: PropTypes.shape({
              id: PropTypes.number,
            }),
          }),
        ),
        memberOf: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            role: PropTypes.string.isRequired,
            since: PropTypes.string.isRequired,
            collective: PropTypes.shape({
              id: PropTypes.number.isRequired,
              name: PropTypes.string.isRequired,
              slug: PropTypes.string.isRequired,
            }),
          }),
        ),
      }),
    }),

    /** @ignore from withIntl */
    intl: PropTypes.object,
  };

  state = {
    nbMemberships: SectionContributions.NB_MEMBERSHIPS_PER_PAGE,
    selectedFilter: FILTERS.ALL,
  };

  static NB_MEMBERSHIPS_PER_PAGE = 20;

  /** There's no point to show all filters if not required */
  getFilters = memoizeOne(memberships => {
    const filters = new Set([FILTERS.ALL]);

    // Add filters to the set based on contributors roles
    const filtersThatHaveFuncs = Object.keys(filterFuncs);
    memberships.forEach(member => {
      const matchingFilter = filtersThatHaveFuncs.find(filter => filterFuncs[filter](member));
      if (matchingFilter) {
        filters.add(matchingFilter);
      }
    });

    // Ensure we preserve filters order by sorting them according to the base list
    return Array.from(filters).sort((filter1, filter2) => {
      return FILTERS_LIST.indexOf(filter1) > FILTERS_LIST.indexOf(filter2) ? 1 : -1;
    });
  });

  /** Return unique members, pick based on role */
  getUniqueMemberships = memoizeOne((memberOf, filter) => {
    let filterFunc = null;
    if (filter === FILTERS.ALL) {
      // Check roles weight to choose between memberships when showing all
      filterFunc = (member, existingMember) => {
        return !existingMember || ROLES_WEIGHT[member.role] > ROLES_WEIGHT[existingMember.role];
      };
    } else {
      // Otherwise just filter on the roles
      filterFunc = filterFuncs[filter];
    }

    // Get unique/filtered memberships
    const membershipsMap = memberOf.reduce((result, member) => {
      if (!member.collective.isIncognito && filterFunc(member, result[member.collective.id])) {
        result[member.collective.id] = member;
      }
      return result;
    }, {});

    return Object.values(membershipsMap);
  });

  sortMemberships = memoizeOne(memberships => {
    // Sort memberships: hosted are always first, then we sort by number of backers then by total amount donated
    return [...memberships].sort((m1, m2) => {
      if (m1.role === roles.HOST && m2.role !== roles.HOST) {
        return -1;
      } else if (m1.role !== roles.HOST && m2.role === roles.HOST) {
        return 1;
      } else if (m1.role === roles.HOST && m1.collective.stats.backers.all !== m2.collective.stats.backers.all) {
        return m1.collective.stats.backers.all > m2.collective.stats.backers.all ? -1 : 1;
      } else if (m1.stats.totalDonations === m2.stats.totalDonations) {
        return 0;
      } else {
        return m1.stats.totalDonations > m2.stats.totalDonations ? -1 : 1;
      }
    });
  });

  showMoreMemberships = () => {
    this.setState(state => ({
      nbMemberships: state.nbMemberships + SectionContributions.NB_MEMBERSHIPS_PER_PAGE,
    }));
  };

  render() {
    const { collective, data, intl } = this.props;
    const { nbMemberships, selectedFilter } = this.state;

    if (data.loading) {
      return <LoadingPlaceholder height={600} borderRadius={0} />;
    } else if (!data.Collective) {
      return (
        <Container display="flex" border="1px dashed #d1d1d1" justifyContent="center" py={[6, 7]} background="#f8f8f8">
          <MessageBox type="error" withIcon>
            <FormattedMessage
              id="NCP.SectionFetchError"
              defaultMessage="We encountered an error while retrieving the data for this section."
            />
          </MessageBox>
        </Container>
      );
    }

    const filters = this.getFilters(data.Collective.memberOf);
    const memberships = this.getUniqueMemberships(data.Collective.memberOf, selectedFilter);
    const sortedMemberships = this.sortMemberships(memberships);
    const connectedCollectives = data.Collective.connectedCollectives;
    const memberOf = data.Collective.memberOf;
    const hasContributions = memberOf.length || connectedCollectives.length;
    const isOrganization = collective.type === CollectiveType.ORGANIZATION;
    return (
      <Box pt={5} pb={3}>
        {!hasContributions ? (
          <Flex flexDirection="column" alignItems="center">
            <img src={EmptyCollectivesSectionImageSVG} alt="" />
            <P color="black.600" fontSize="16px" mt={5}>
              <FormattedMessage
                id="CollectivePage.SectionContributions.Empty"
                defaultMessage="{collectiveName} seems to be hibernating in a cave in the North Pole ❄️☃️!"
                values={{ collectiveName: collective.name }}
              />
            </P>
          </Flex>
        ) : (
          <React.Fragment>
            {memberOf.length > 0 && (
              <React.Fragment>
                <ContainerSectionContent>
                  <SectionTitle data-cy="section-contributions-title" textAlign="left" mb={1}>
                    <FormattedMessage id="Contributions" defaultMessage="Contributions" />
                  </SectionTitle>
                  {data.Collective.stats.collectives.hosted > 0 && (
                    <H3 fontSize="20px" fontWeight="500" color="black.600">
                      <FormattedMessage
                        id="organization.collective.memberOf.collective.host.title"
                        values={{ n: data.Collective.stats.collectives.hosted }}
                        defaultMessage="We are fiscally hosting {n, plural, one {this Collective} other {{n} Collectives}}"
                      />
                    </H3>
                  )}
                </ContainerSectionContent>
                {filters.length > 1 && (
                  <Box mt={4} mx="auto" maxWidth={Dimensions.MAX_SECTION_WIDTH}>
                    <StyledFilters
                      filters={filters}
                      getLabel={key => intl.formatMessage(I18nFilters[key])}
                      onChange={filter => this.setState({ selectedFilter: filter })}
                      selected={selectedFilter}
                      justifyContent="left"
                      minButtonWidth={175}
                      px={Dimensions.PADDING_X}
                    />
                  </Box>
                )}
                <Container
                  data-cy="Contributions"
                  maxWidth={Dimensions.MAX_SECTION_WIDTH}
                  px={Dimensions.PADDING_X}
                  mt={4}
                  mx="auto"
                >
                  <Grid gridGap={24} gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
                    {sortedMemberships.slice(0, nbMemberships).map(membership => (
                      <MembershipCardContainer data-cy="collective-contribution" key={membership.id}>
                        <StyledMembershipCard membership={membership} />
                      </MembershipCardContainer>
                    ))}
                  </Grid>
                </Container>
                {nbMemberships < sortedMemberships.length && (
                  <Flex mt={3} justifyContent="center">
                    <StyledButton
                      data-cy="load-more"
                      textTransform="capitalize"
                      minWidth={170}
                      onClick={this.showMoreMemberships}
                    >
                      <FormattedMessage id="loadMore" defaultMessage="load more" /> ↓
                    </StyledButton>
                  </Flex>
                )}
              </React.Fragment>
            )}

            {connectedCollectives.length > 0 && (
              <Box mt={5}>
                <ContainerSectionContent>
                  <SectionTitle textAlign="left" mb={4}>
                    {isOrganization ? (
                      <FormattedMessage
                        id="CP.Contributions.PartOfOrg"
                        defaultMessage="{n, plural, one {This Collective is} other {These Collectives are}} part of our Organization"
                        values={{ n: connectedCollectives.length }}
                      />
                    ) : (
                      <FormattedMessage
                        id="CP.Contributions.ConnectedCollective"
                        defaultMessage="{n, plural, one {This Collective is} other {These Collectives are}} part of what we do"
                        values={{ n: connectedCollectives.length }}
                      />
                    )}
                  </SectionTitle>
                </ContainerSectionContent>
                <Container maxWidth={Dimensions.MAX_SECTION_WIDTH} pl={Dimensions.PADDING_X} m="0 auto">
                  <Grid gridGap={24} gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
                    {connectedCollectives.map(({ id, collective }) => (
                      <MembershipCardContainer key={id}>
                        <StyledMembershipCard membership={{ collective }} />
                      </MembershipCardContainer>
                    ))}
                  </Grid>
                </Container>
              </Box>
            )}
          </React.Fragment>
        )}
      </Box>
    );
  }
}

export const contributionsSectionQuery = gql`
  query ContributionsSection($slug: String!) {
    Collective(slug: $slug) {
      id
      settings
      stats {
        id
        collectives {
          id
          hosted
        }
      }
      connectedCollectives: members(role: "CONNECTED_COLLECTIVE") {
        id
        collective: member {
          id
          name
          slug
          type
          currency
          isIncognito
          description
          imageUrl(height: 128)
          backgroundImageUrl(height: 200)
          tags
          settings
          parentCollective {
            id
            backgroundImageUrl
            name
            slug
          }
          host {
            id
          }
          stats {
            id
            backers {
              id
              all
            }
          }
        }
      }
      memberOf(onlyActiveCollectives: true, limit: 1500) {
        id
        role
        since
        description
        stats {
          id
          totalDonations
        }
        collective {
          id
          name
          slug
          type
          currency
          isIncognito
          description
          imageUrl(height: 128)
          backgroundImageUrl(height: 200)
          tags
          parentCollective {
            id
            backgroundImageUrl(height: 200)
          }
          host {
            id
          }
          stats {
            id
            backers {
              id
              all
            }
          }
        }
      }
    }
  }
`;

export const getContributionsSectionQueryVariables = slug => {
  return { slug };
};

const addContributionsSectionData = graphql(contributionsSectionQuery, {
  options: props => ({
    variables: getContributionsSectionQueryVariables(props.collective.slug),
  }),
});

export default React.memo(injectIntl(addContributionsSectionData(SectionContributions)));
