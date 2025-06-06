import React from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import { FormattedMessage } from 'react-intl';

import ContributorsFilter, { filterContributors, getContributorsFilters } from '../ContributorsFilter';
import ContributorsGrid from '../ContributorsGrid';
import { Box } from '../Grid';
import { H2, P } from '../Text';

const CONTENT_WIDTH = 1440;

export default class TierContributors extends React.Component {
  static propTypes = {
    /** Contributors */
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        roles: PropTypes.arrayOf(PropTypes.string.isRequired),
        isCore: PropTypes.bool.isRequired,
        isBacker: PropTypes.bool.isRequired,
      }),
    ),
    /** Some statistics about this tier */
    contributorsStats: PropTypes.shape({
      all: PropTypes.number.isRequired,
      collectives: PropTypes.number.isRequired,
      organizations: PropTypes.number.isRequired,
      users: PropTypes.number.isRequired,
    }).isRequired,
    /** Currency for contributions */
    currency: PropTypes.string.isRequired,
    // Collective id
    collectiveId: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = { filter: null };
  }

  static MIN_CONTRIBUTORS_TO_SHOW_FILTERS = 2;

  setFilter = filter => {
    this.setState({ filter });
  };

  // Memoize filtering functions as they can get expensive if there are a lot of contributors
  getContributorsFilters = memoizeOne(getContributorsFilters);
  filterContributors = memoizeOne(filterContributors);

  render() {
    const { contributors, contributorsStats, currency, collectiveId } = this.props;
    const { filter } = this.state;
    const hasFilters = contributors.length >= TierContributors.MIN_CONTRIBUTORS_TO_SHOW_FILTERS;
    const filters = hasFilters && this.getContributorsFilters(contributors);
    const filteredContributors = hasFilters ? this.filterContributors(contributors, filter) : contributors;

    return (
      <Box>
        <Box m="0 auto" css={{ maxWidth: CONTENT_WIDTH }}>
          <H2 mb={3} px={3}>
            <FormattedMessage
              id="TierPage.ContributorsCountGoal"
              defaultMessage="{userCount, plural, =0 {} one {# individual } other {# individuals }} {both, plural, =0 {} other {and }}{orgCount, plural, =0 {} one {# organization} other {# organizations}} {totalCount, plural, one {has } other {have }} contributed to this goal"
              values={{
                orgCount: contributorsStats.organizations,
                userCount: contributorsStats.users,
                both:
                  (contributorsStats.organizations || contributorsStats.collectives) && contributorsStats.users ? 1 : 0,
                totalCount: contributorsStats.all,
              }}
            />
          </H2>
          <P color="black.600" mb={4} px={3}>
            <FormattedMessage
              id="TierPage.ContributorsDescription"
              defaultMessage="Join us in contributing to this tier!"
            />
          </P>
          {hasFilters && filters.length > 2 && (
            <ContributorsFilter selected={filter} onChange={this.setFilter} filters={filters} />
          )}
        </Box>
        <Box mb={4}>
          <ContributorsGrid
            contributors={filteredContributors}
            currency={currency}
            collectiveId={collectiveId}
            maxWidthWhenNotFull={CONTENT_WIDTH + 16} // Add 16 to compensate for the margin of the card
          />
        </Box>
      </Box>
    );
  }
}
