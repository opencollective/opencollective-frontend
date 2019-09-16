import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import gql from 'graphql-tag';
import { graphql, Query } from 'react-apollo';
import memoizeOne from 'memoize-one';

import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';
import { P } from '../../Text';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledMembershipCard from '../../StyledMembershipCard';
import StyledButton from '../../StyledButton';
import StyledFilters from '../../StyledFilters';

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

const MAX_STYLED_FILTERS_WIDTH = Dimensions.MAX_SECTION_WIDTH - Dimensions.PADDING_X[1];

const ParentedCollectivesQuery = gql`
  query SuperCollectiveChildren($tags: [String]) {
    allCollectives(orderBy: balance, orderDirection: DESC, limit: 50, tags: $tags) {
      collectives {
        id
        name
        slug
        type
        currency
        isIncognito
        description
        backgroundImage
        tags
        parentCollective {
          id
          backgroundImage
        }
        host {
          id
        }
        stats {
          id
          yearlyBudget
          backers {
            id
            all
          }
        }
      }
    }
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
        yearlyBudget: PropTypes.number,
      }).isRequired,
    }).isRequired,

    /** @ignore from withData */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Collective: PropTypes.shape({
        settings: PropTypes.shape({
          superCollectiveTags: PropTypes.arrayOf(PropTypes.string),
        }),
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

  static NB_MEMBERSHIPS_PER_PAGE = 16;

  state = {
    nbMemberships: SectionContributions.NB_MEMBERSHIPS_PER_PAGE,
    selectedFilter: FILTERS.ALL,
  };

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
    // Sort memberships: hosted are always first, then we sort by yearly budget then by total amount donated
    return [...memberships].sort((m1, m2) => {
      if (m1.role === roles.HOST && m2.role !== roles.HOST) {
        return -1;
      } else if (m1.role !== roles.HOST && m2.role === roles.HOST) {
        return 1;
      } else if (m1.role === roles.HOST) {
        return m1.collective.stats.yearlyBudget > m2.collective.stats.yearlyBudget ? -1 : 1;
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
    }

    const filters = this.getFilters(data.Collective.memberOf);
    const memberships = this.getUniqueMemberships(data.Collective.memberOf, selectedFilter);
    const sortedMemberships = this.sortMemberships(memberships);
    const isOrganization = collective.type === CollectiveType.ORGANIZATION;
    const superCollectiveTags = get(collective, 'settings.superCollectiveTags', []);
    return (
      <Box py={5}>
        {data.Collective.memberOf.length === 0 ? (
          <Flex flexDirection="column" alignItems="center">
            <img src={EmptyCollectivesSectionImageSVG} alt="" />
            <P color="black.600" fontSize="LeadParagraph" mt={5}>
              <FormattedMessage
                id="CollectivePage.SectionContributions.Empty"
                defaultMessage="{collectiveName} seems to be hibernating on a cave in the North Pole ❄️☃️!"
                values={{ collectiveName: collective.name }}
              />
            </P>
          </Flex>
        ) : (
          <React.Fragment>
            <ContainerSectionContent>
              <SectionTitle textAlign={['center', 'left']} mb={4}>
                <FormattedMessage id="CollectivePage.SectionContributions.Title" defaultMessage="Contributions" />
              </SectionTitle>
            </ContainerSectionContent>
            {filters.length > 1 && (
              <Box mb={4} mx="auto" maxWidth={MAX_STYLED_FILTERS_WIDTH}>
                <StyledFilters
                  filters={filters}
                  getLabel={key => intl.formatMessage(I18nFilters[key])}
                  onChange={filter => this.setState({ selectedFilter: filter })}
                  selected={selectedFilter}
                  justifyContent={['center', 'left']}
                />
              </Box>
            )}
            <ContainerSectionContent>
              <Flex flexWrap="wrap" justifyContent={['space-evenly', null, null, 'left']}>
                {sortedMemberships.slice(0, nbMemberships).map(membership => (
                  <StyledMembershipCard key={membership.id} membership={membership} mb={40} mr={[1, 4, 34]} />
                ))}
              </Flex>
              {nbMemberships < sortedMemberships.length && (
                <Flex mt={3} justifyContent="center">
                  <StyledButton textTransform="capitalize" minWidth={170} onClick={this.showMoreMemberships}>
                    <FormattedMessage id="loadMore" defaultMessage="load more" /> ↓
                  </StyledButton>
                </Flex>
              )}
            </ContainerSectionContent>
          </React.Fragment>
        )}
        {isOrganization && superCollectiveTags.length > 0 && (
          <Query query={ParentedCollectivesQuery} variables={{ tags: superCollectiveTags }}>
            {({ loading, error, data: subCollectivesData }) => {
              const collectives = get(subCollectivesData, 'allCollectives.collectives', []);
              if (loading || error || collectives.length === 0) {
                return null;
              }
              return (
                <section>
                  <SectionTitle textAlign={['center', 'left']} mb={4}>
                    <FormattedMessage
                      id="CP.Contributions.PartOfOrg"
                      defaultMessage="{n, plural, one {This Collective is} other {These Collectives are}} part of our Organization"
                      values={{ n: collectives.length }}
                    />
                  </SectionTitle>
                  <Flex flexWrap="wrap" justifyContent={['space-evenly', null, null, 'left']}>
                    {collectives.map(collective => (
                      <StyledMembershipCard key={collective.id} membership={{ collective }} mb={40} mr={[1, 4, 34]} />
                    ))}
                  </Flex>
                </section>
              );
            }}
          </Query>
        )}
      </Box>
    );
  }
}

const withData = graphql(
  gql`
    query SectionCollective($id: Int!) {
      Collective(id: $id) {
        id
        settings
        memberOf(onlyActiveCollectives: true) {
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
            backgroundImage
            tags
            parentCollective {
              id
              backgroundImage
            }
            host {
              id
            }
            stats {
              id
              yearlyBudget
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
