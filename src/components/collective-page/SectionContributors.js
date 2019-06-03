import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';

import { P, H2, H3, Span } from '../Text';
import ContributorsGrid from '../ContributorsGrid';
import ContributorsFilter, { filterMembers, getMembersFilters, CONTRIBUTOR_FILTERS } from '../ContributorsFilter';

export default class SectionContributors extends React.PureComponent {
  static propTypes = {
    collectiveName: PropTypes.string.isRequired,
    members: PropTypes.arrayOf(PropTypes.object),
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
    const { collectiveName, members } = this.props;
    const { filter } = this.state;
    const filters = this.getMembersFilters(members);
    const filteredMembers = this.filterMembers(members, filter);

    return (
      <Box pt={6}>
        <Box m="0 auto" css={{ maxWidth: 1440 }}>
          <H2 mb={4} px={3} fontSize={80} lineHeight="1em" color="black.900">
            <FormattedMessage
              id="CollectivePage.AllOfUs"
              defaultMessage="{collectiveName} is all of us"
              values={{ collectiveName }}
            />
          </H2>
          <H3 mb={3} px={3} fontSize="H2" fontWeight="normal" color="black.900">
            <FormattedMessage
              id="CollectivePage.OurContributors"
              defaultMessage="Our contributors {count}"
              values={{ count: <Span color="black.400">{members.length}</Span> }}
            />
          </H3>
          <P color="black.600" mb={4} px={3}>
            <FormattedMessage
              id="TierPage.ContributorsDescription"
              defaultMessage="Everyone who has supported {collectiveName}. Individuals and organizations that believe in –and take ownership of– our purpose."
              values={{ collectiveName }}
            />
          </P>
          {filters.length > 2 && members.length >= SectionContributors.MIN_MEMBERS_TO_SHOW_FILTERS && (
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
