import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import memoizeOne from 'memoize-one';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';
import { P, H3 } from '../../Text';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledMembershipCard from '../../StyledMembershipCard';
import StyledButton from '../../StyledButton';
import StyledFilters from '../../StyledFilters';
import Container from '../../Container';
import { fadeIn } from '../../StyledKeyframes';
import MessageBox from '../../MessageBox';

// Local imports
import SectionTitle from '../SectionTitle';
import ContainerSectionContent from '../ContainerSectionContent';
import EmptyCollectivesSectionImageSVG from '../images/EmptyCollectivesSectionImage.svg';
import { Dimensions } from '../_constants';

const FILTERS = { ALL: 'ALL', HOST: 'HOST', CORE: 'CORE', FINANCIAL: 'FINANCIAL', EVENTS: 'EVENTS' };
const FILTERS_LIST = Object.values(FILTERS);
const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'SectionContributions.All',
    defaultMessage: 'All Contributions',
  },
  [FILTERS.HOST]: {
    id: 'SectionContributions.Host',
    defaultMessage: 'Fiscal Host',
  },
  [FILTERS.FINANCIAL]: {
    id: 'SectionContributions.Financial',
    defaultMessage: 'Financial Contributor',
  },
  [FILTERS.CORE]: {
    id: 'SectionContributions.Core',
    defaultMessage: 'Core Contributor',
  },
  [FILTERS.EVENTS]: {
    id: 'SectionContributions.Events',
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
  [FILTERS.HOST]: ({ role }) => role === roles.HOST,
  [FILTERS.FINANCIAL]: ({ role }) => role === roles.BACKER,
  [FILTERS.CORE]: ({ role }) => role === roles.ADMIN || role === roles.MEMBER,
  [FILTERS.EVENTS]: ({ role }) => role === roles.ATTENDEE,
};

/** A container for membership cards to ensure we have a smooth transition */
const MembershipCardContainer = styled.div`
  animation: ${fadeIn} 0.2s;
  margin-bottom: 40px;
  margin-right: 4px;

  @media screen and (min-width: 40em) {
    margin-right: 5%;
  }

  @media screen and (min-width: 64em) {
    margin-right: 2%;
  }

  @media screen and (min-width: 1250px) {
    margin-right: 57px;
    margin-bottom: 50px;
  }
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
        subCollectives: PropTypes.arrayOf(
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

  static NB_MEMBERSHIPS_PER_PAGE = 16;

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
      console.error(`Empty collective data #${collective.id} in Contributions section`);
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
    const subCollectives = data.Collective.subCollectives;
    const memberOf = data.Collective.memberOf;
    const hasContributions = memberOf.length || subCollectives.length;
    const isOrganization = collective.type === CollectiveType.ORGANIZATION;
    return (
      <Box pt={5} pb={3}>
        {!hasContributions ? (
          <Flex flexDirection="column" alignItems="center">
            <img src={EmptyCollectivesSectionImageSVG} alt="" />
            <P color="black.600" fontSize="LeadParagraph" mt={5}>
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
                    <FormattedMessage id="CollectivePage.SectionContributions.Title" defaultMessage="Contributions" />
                  </SectionTitle>
                  {data.Collective.stats.collectives.hosted > 0 && (
                    <H3 fontSize="H5" fontWeight="500" color="black.600">
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
                  pl={Dimensions.PADDING_X}
                  mt={4}
                  mx="auto"
                >
                  <Flex flexWrap="wrap" justifyContent={['space-evenly', 'left']}>
                    {sortedMemberships.slice(0, nbMemberships).map(membership => (
                      <MembershipCardContainer data-cy="collective-contribution" key={membership.id}>
                        <StyledMembershipCard membership={membership} />
                      </MembershipCardContainer>
                    ))}
                  </Flex>
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

            {subCollectives.length > 0 && (
              <Box mt={5}>
                <ContainerSectionContent>
                  <SectionTitle textAlign="left" mb={4}>
                    {isOrganization ? (
                      <FormattedMessage
                        id="CP.Contributions.PartOfOrg"
                        defaultMessage="{n, plural, one {This Collective is} other {These Collectives are}} part of our Organization"
                        values={{ n: subCollectives.length }}
                      />
                    ) : (
                      <FormattedMessage
                        id="CP.Contributions.SubCollective"
                        defaultMessage="{n, plural, one {This Collective is} other {These Collectives are}} part of what we do"
                        values={{ n: subCollectives.length }}
                      />
                    )}
                  </SectionTitle>
                </ContainerSectionContent>
                <Container maxWidth={Dimensions.MAX_SECTION_WIDTH} pl={Dimensions.PADDING_X} m="0 auto">
                  <Flex flexWrap="wrap" justifyContent={['space-evenly', 'left']}>
                    {subCollectives.map(({ id, collective }) => (
                      <MembershipCardContainer key={id}>
                        <StyledMembershipCard membership={{ collective }} />
                      </MembershipCardContainer>
                    ))}
                  </Flex>
                </Container>
              </Box>
            )}
          </React.Fragment>
        )}
      </Box>
    );
  }
}

const withData = graphql(
  gql`
    query SectionContributions($id: Int!) {
      Collective(id: $id) {
        id
        settings
        stats {
          id
          collectives {
            id
            hosted
          }
        }
        subCollectives: members(role: "SUB_COLLECTIVE") {
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
  `,
  {
    options(props) {
      return { variables: { id: props.collective.id } };
    },
  },
);

export default React.memo(injectIntl(withData(SectionContributions)));
