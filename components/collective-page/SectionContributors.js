import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';

import { CollectiveType } from '../../lib/constants/collectives';
import Container from '../Container';
import { P, H2, H3, Span } from '../Text';
import ContributorsGrid, { COLLECTIVE_CARD_MARGIN_X } from '../ContributorsGrid';
import * as ContributorsFilter from '../ContributorsFilter';

import { Dimensions } from './_constants';
import ContainerSectionContent from './ContainerSectionContent';
import ContributorsGridBackgroundSVG from './ContributorsGridBackground.svg';

/** Main contributors container with the bubbles background */
const MainContainer = styled(Container)`
  background: linear-gradient(180deg, transparent 90%, white), url(${ContributorsGridBackgroundSVG});

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
    collective: PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        since: PropTypes.string.isRequired,
        roles: PropTypes.arrayOf(PropTypes.string.isRequired),
        isCore: PropTypes.bool.isRequired,
        isBacker: PropTypes.bool.isRequired,
        isFundraiser: PropTypes.bool.isRequired,
        totalAmountDonated: PropTypes.number.isRequired,
      }),
    ),
  };

  static MIN_CONTRIBUTORS_TO_SHOW_FILTERS = 2;

  constructor(props) {
    super(props);
    this.state = { filter: ContributorsFilter.CONTRIBUTOR_FILTERS.ALL };
  }

  setFilter = filter => {
    this.setState({ filter });
  };

  // Memoize filtering functions as they can get expensive if there are a lot of contributors
  getContributorsFilters = memoizeOne(ContributorsFilter.getContributorsFilters);
  filterContributors = memoizeOne(ContributorsFilter.filterContributors);
  sortContributors = memoizeOne(contributors => {
    // Sort contributors: core contributors are always first, then we sort by total amount donated
    // We make a copy of the array because mutation could break memoization for future renderings
    return [...contributors].sort((c1, c2) => {
      // Try to make a difference based on roles
      if ((c1.isAdmin && !c2.isAdmin) || (c1.isCore && !c2.isCore)) {
        return -1;
      } else if ((!c1.isAdmin && c2.isAdmin) || (!c1.isCore && c2.isCore)) {
        return 1;
      } else if ((c1.isAdmin && c2.isAdmin) || (c1.isCore && c2.isCore)) {
        // For admins/core contributors, sort by `since`
        return c1.since < c2.since ? -1 : 1;
      }

      // Otherwise on the amount donated
      if (c1.totalAmountDonated > c2.totalAmountDonated) {
        return -1;
      } else if (c1.totalAmountDonated < c2.totalAmountDonated) {
        return 1;
      } else {
        return 0;
      }
    });
  });

  render() {
    const { collective, contributors } = this.props;
    const { filter } = this.state;
    const onlyShowCore = collective.type === CollectiveType.ORGANIZATION;
    const hasFilters = !onlyShowCore && contributors.length >= SectionContributors.MIN_CONTRIBUTORS_TO_SHOW_FILTERS;
    const activeFilter = onlyShowCore ? ContributorsFilter.CONTRIBUTOR_FILTERS.CORE : filter;
    const filters = hasFilters && this.getContributorsFilters(contributors);
    const filteredContributors = this.filterContributors(contributors, activeFilter);
    const sortedContributors = this.sortContributors(filteredContributors);

    return (
      <MainContainer py={[4, 5]}>
        <ContainerSectionContent>
          {!onlyShowCore ? (
            <React.Fragment>
              <H2 mb={4} fontSize={['H3', 80]} lineHeight="1em" color="black.900" wordBreak="break-word">
                <FormattedMessage
                  id="CollectivePage.AllOfUs"
                  defaultMessage="{collectiveName} is all of us"
                  values={{ collectiveName: collective.name }}
                />
              </H2>
              <H3 mb={3} fontSize={['H4', 'H2']} fontWeight="normal" color="black.900">
                <FormattedMessage
                  id="CollectivePage.OurContributors"
                  defaultMessage="Our contributors {count}"
                  values={{ count: <Span color="black.400">{contributors.length}</Span> }}
                />
              </H3>
              <P color="black.600" mb={4}>
                <FormattedMessage
                  id="CollectivePage.ContributorsDescription"
                  defaultMessage="Everyone who has supported {collectiveName}. Individuals and organizations that believe in –and take ownership of– our purpose."
                  values={{ collectiveName: collective.name }}
                />
              </P>
            </React.Fragment>
          ) : (
            <H2 mb={4} textAlign={['center', 'left']} fontWeight="normal" color="black.900">
              <FormattedMessage id="ContributorsFilter.Core" defaultMessage="Core contributors" />
            </H2>
          )}
        </ContainerSectionContent>
        {hasFilters && filters.length > 2 && (
          <Container maxWidth={Dimensions.MAX_SECTION_WIDTH - 30} margin="0 auto">
            <ContributorsFilter.default
              selected={filter}
              onChange={this.setFilter}
              filters={filters}
              selectedButtonStyle="primary"
            />
          </Container>
        )}
        <Box mb={4}>
          <ContributorsGrid
            contributors={sortedContributors}
            getPaddingLeft={({ width, rowWidth, nbRows }) => {
              if (width < Dimensions.MAX_SECTION_WIDTH) {
                // No need for padding on screens small enough so they don't have padding
                return 0;
              } else if (nbRows > 1) {
                if (rowWidth <= width) {
                  // If multiline and possible center contributors cards
                  const cardsLeftOffset = COLLECTIVE_CARD_MARGIN_X / 2;
                  return (width - rowWidth) / 2 - cardsLeftOffset;
                } else {
                  // Otherwise if multiline and the grid is full, just use the full screen
                  return 0;
                }
              } else {
                // Otherwise add a normal section padding on the left
                const cardsLeftOffset = COLLECTIVE_CARD_MARGIN_X / 2;
                return (width - Dimensions.MAX_SECTION_WIDTH) / 2 - cardsLeftOffset;
              }
            }}
          />
        </Box>
      </MainContainer>
    );
  }
}
