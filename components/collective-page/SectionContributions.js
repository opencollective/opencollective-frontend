import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import memoizeOne from 'memoize-one';

import roles from '../../lib/constants/roles';
import { H2, P } from '../Text';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledMembershipCard from '../StyledMembershipCard';

import ContainerSectionContent from './ContainerSectionContent';
import EmptyCollectivesSectionImageSVG from './EmptyCollectivesSectionImage.svg';
import StyledButton from '../StyledButton';
import StyledFilters from '../StyledFilters';

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

class SectionContributions extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,

    /** @ignore from withData */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Collective: PropTypes.shape({
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
    return (
      <ContainerSectionContent pt={5} pb={6}>
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
            <H2 mb={4} textAlign={['center', 'left']} fontWeight="normal" color="black.900">
              <FormattedMessage id="CollectivePage.SectionContributions.Title" defaultMessage="Contributions" />
            </H2>
            {filters.length > 1 && (
              <Box mb={4}>
                <StyledFilters
                  filters={filters}
                  getLabel={key => intl.formatMessage(I18nFilters[key])}
                  onChange={filter => this.setState({ selectedFilter: filter })}
                  selected={selectedFilter}
                />
              </Box>
            )}
            <Flex flexWrap="wrap" justifyContent={memberships.length >= 4 ? 'space-evenly' : 'left'}>
              {memberships.slice(0, nbMemberships).map(membership => (
                <StyledMembershipCard
                  key={membership.id}
                  role={membership.role}
                  description={membership.description}
                  since={membership.since}
                  toCollective={membership.collective}
                  mb={40}
                  mr={[1, 4]}
                />
              ))}
            </Flex>
            {nbMemberships < memberships.length && (
              <Flex mt={3} justifyContent="center">
                <StyledButton textTransform="capitalize" minWidth={170} onClick={this.showMoreMemberships}>
                  <FormattedMessage id="loadMore" defaultMessage="load more" /> ↓
                </StyledButton>
              </Flex>
            )}
          </React.Fragment>
        )}
      </ContainerSectionContent>
    );
  }
}

const withData = graphql(
  gql`
    query SectionCollective($id: Int!) {
      Collective(id: $id) {
        id
        memberOf {
          id
          role
          since
          description
          collective {
            id
            name
            slug
            type
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
