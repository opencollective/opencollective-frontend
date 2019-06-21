import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';

import { P, H2, H3, Span } from '../Text';
import ContributorsGrid from '../ContributorsGrid';
import ContributorsFilter, { filterMembers, getMembersFilters, CONTRIBUTOR_FILTERS } from '../ContributorsFilter';
import ContainerSectionContent from './ContainerSectionContent';
import ContributorsGridBackgroundSVG from './ContributorsGridBackground.svg';

/** Main contributors container with the bubbles background */
const MainContainer = styled.div`
  padding: 128px 0;
  background: url(${ContributorsGridBackgroundSVG});

  @media (max-width: 52em) {
    background-size: cover;
  }

  @media (min-width: 52em) {
    background-position-y: -200%;
  }
`;

/**
 * Section that displays all the contributors to the collective (financial, admins...etc)
 */
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
      <MainContainer>
        <ContainerSectionContent>
          <H2 mb={4} px={3} fontSize={['H3', 80]} lineHeight="1em" color="black.900" wordBreak="break-word">
            <FormattedMessage
              id="CollectivePage.AllOfUs"
              defaultMessage="{collectiveName} is all of us"
              values={{ collectiveName }}
            />
          </H2>
          <H3 mb={3} px={3} fontSize={['H4', 'H2']} fontWeight="normal" color="black.900">
            <FormattedMessage
              id="CollectivePage.OurContributors"
              defaultMessage="Our contributors {count}"
              values={{ count: <Span color="black.400">{members.length}</Span> }}
            />
          </H3>
          <P color="black.600" mb={4} px={3}>
            <FormattedMessage
              id="CollectivePage.ContributorsDescription"
              defaultMessage="Everyone who has supported {collectiveName}. Individuals and organizations that believe in –and take ownership of– our purpose."
              values={{ collectiveName }}
            />
          </P>
          {filters.length > 2 && members.length >= SectionContributors.MIN_MEMBERS_TO_SHOW_FILTERS && (
            <ContributorsFilter selected={filter} onChange={this.setFilter} filters={filters} />
          )}
        </ContainerSectionContent>
        <Box mb={4}>
          <ContributorsGrid members={filteredMembers} />
        </Box>
      </MainContainer>
    );
  }
}
