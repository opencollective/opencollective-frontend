import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';

import Container from '../Container';
import { P, H2, H3, Span } from '../Text';
import ContributorsGrid from '../ContributorsGrid';
import ContributorsFilter, { filterContributors, getContributorsFilters } from '../ContributorsFilter';

import { Dimensions } from './_constants';
import ContainerSectionContent from './ContainerSectionContent';
import ContributorsGridBackgroundSVG from './ContributorsGridBackground.svg';

/** Main contributors container with the bubbles background */
const MainContainer = styled(Container)`
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
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        roles: PropTypes.arrayOf(PropTypes.string.isRequired),
        isCore: PropTypes.bool.isRequired,
        isBacker: PropTypes.bool.isRequired,
        isFundraiser: PropTypes.bool.isRequired,
      }),
    ),
  };

  static MIN_CONTRIBUTORS_TO_SHOW_FILTERS = 2;

  constructor(props) {
    super(props);
    this.state = { filter: null };
  }

  setFilter = filter => {
    this.setState({ filter });
  };

  // Memoize filtering functions as they can get expensive if there are a lot of contributors
  getContributorsFilters = memoizeOne(getContributorsFilters);
  filterContributors = memoizeOne(filterContributors);

  render() {
    const { collectiveName, contributors } = this.props;
    const { filter } = this.state;
    const hasFilters = contributors.length >= SectionContributors.MIN_CONTRIBUTORS_TO_SHOW_FILTERS;
    const filters = hasFilters && this.getContributorsFilters(contributors);
    const filteredContributors = hasFilters ? this.filterContributors(contributors, filter) : contributors;

    return (
      <MainContainer py={[4, 5]}>
        <ContainerSectionContent>
          <H2 mb={4} fontSize={['H3', 80]} lineHeight="1em" color="black.900" wordBreak="break-word">
            <FormattedMessage
              id="CollectivePage.AllOfUs"
              defaultMessage="{collectiveName} is all of us"
              values={{ collectiveName }}
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
              values={{ collectiveName }}
            />
          </P>
        </ContainerSectionContent>
        {hasFilters && filters.length > 2 && (
          <Container maxWidth={Dimensions.MAX_SECTION_WIDTH - 30} margin="0 auto">
            <ContributorsFilter
              selected={filter}
              onChange={this.setFilter}
              filters={filters}
              selectedButtonStyle="primary"
            />
          </Container>
        )}
        <Box mb={4}>
          <ContributorsGrid
            contributors={filteredContributors}
            getPaddingLeft={({ width, rowWidth, nbRows }) => {
              if (width < Dimensions.MAX_SECTION_WIDTH) {
                // No need for padding on screens small enough so they don't have padding
                return 0;
              } else if (nbRows > 1) {
                if (rowWidth <= width) {
                  // If multiline and possible center contributors cards
                  return (width - rowWidth) / 2;
                } else {
                  // Otherwise if multiline and the grid is full, just use the full screen
                  return 0;
                }
              } else {
                // Otherwise add a normal section padding on the left
                return (width - Dimensions.MAX_SECTION_WIDTH) / 2;
              }
            }}
          />
        </Box>
      </MainContainer>
    );
  }
}
