import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';

import { P, H2 } from '../Text';
import ContributorsGrid from '../ContributorsGrid';
import ContributorsFilter, { filterMembers, getMembersFilters, CONTRIBUTOR_FILTERS } from '../ContributorsFilter';

export default class TierContributors extends React.Component {
  static propTypes = {
    collectiveName: PropTypes.string.isRequired,
    members: PropTypes.arrayOf(PropTypes.object),
    /** Some statistics about this tier */
    membersStats: PropTypes.shape({
      all: PropTypes.number.isRequired,
      collectives: PropTypes.number.isRequired,
      organizations: PropTypes.number.isRequired,
      users: PropTypes.number.isRequired,
    }).isRequired,
  };

  static MIN_MEMBERS_TO_SHOW_FILTERS = 2;

  constructor(props) {
    super(props);
    this.state = { filter: CONTRIBUTOR_FILTERS.ALL };
  }

  setFilter = filter => {
    this.setState({ filter });
  };

  // Memoize filtering functions as they can get expensive if there are a lot of members
  getMembersFilters = memoizeOne(getMembersFilters);
  filterMembers = memoizeOne(filterMembers);

  render() {
    const { collectiveName, members, membersStats } = this.props;
    const { filter } = this.state;
    const filters = this.getMembersFilters(members);
    const filteredMembers = this.filterMembers(members, filter);

    return (
      <Box>
        <Box m="0 auto" css={{ maxWidth: 1440 }}>
          <H2 mb={3} px={3}>
            <FormattedMessage
              id="TierPage.ContributorsCountGoal"
              defaultMessage="{userCount, plural, =0 {} one {# individual } other {# individuals }} {both, plural, =0 {} one {and }}{orgCount, plural, =0 {} one {# organization} other {# organizations}} {totalCount, plural, one {has } other {have }} contributed to this goal"
              values={{
                orgCount: membersStats.organizations,
                userCount: membersStats.users,
                both: (membersStats.organizations || membersStats.collectives) && membersStats.users ? 1 : 0,
                totalCount: membersStats.all,
              }}
            />
          </H2>
          <P color="black.600" mb={4} px={3}>
            <FormattedMessage
              id="TierPage.ContributorsDescription"
              defaultMessage="Join us in contributing to this tier!"
              values={{ collectiveName }}
            />
          </P>
          {filters.length > 2 && members.length >= TierContributors.MIN_MEMBERS_TO_SHOW_FILTERS && (
            <ContributorsFilter selected={filter} onChange={this.setFilter} filters={filters} />
          )}
        </Box>
        <Box mb={4}>
          <ContributorsGrid members={filteredMembers} />
        </Box>
      </Box>
    );
  }
}
