import React from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import * as ContributorsFilter from '../../ContributorsFilter';
import ContributorsGrid from '../../ContributorsGrid';
import { H3, P, Span } from '../../Text';
// Local imports
import { Dimensions } from '../_constants';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

import ContributorsGridBackgroundSVG from '../../../public/static/images/collective-page/ContributorsGridBackground.svg';

/** Main contributors container with the bubbles background */
const MainContainer = styled(Container)`
  background:
    linear-gradient(
      0deg,
      rgba(255, 255, 255, 1) 0,
      rgba(255, 255, 255, 0) 75px,
      rgba(255, 255, 255, 0) calc(100% - 125px),
      rgba(255, 255, 255, 1) 100%
    ),
    center -900px repeat-y url(${ContributorsGridBackgroundSVG});
`;

const ExpectedContributorsPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  since: PropTypes.string.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string.isRequired),
  isCore: PropTypes.bool.isRequired,
  isBacker: PropTypes.bool.isRequired,
  totalAmountDonated: PropTypes.number.isRequired,
});

/**
 * Section that displays all the contributors to the collective (financial, admins...etc)
 */
export default class SectionContributors extends React.PureComponent {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
    }),
    stats: PropTypes.shape({
      backers: PropTypes.shape({
        all: PropTypes.number,
      }),
    }).isRequired,
    coreContributors: PropTypes.arrayOf(ExpectedContributorsPropTypes),
    financialContributors: PropTypes.arrayOf(ExpectedContributorsPropTypes),
  };

  constructor(props) {
    super(props);
    this.state = { filter: ContributorsFilter.CONTRIBUTOR_FILTERS.ALL };
    /* reference to the FixedSizedGrid element */
    this.contributorsGridRef = React.createRef();
  }

  static MIN_CONTRIBUTORS_TO_SHOW_FILTERS = 2;

  setFilter = filter => {
    this.setState({ filter });

    // whenever the filter is changed, scroll is set to point to the initial item
    this.contributorsGridRef.current.scrollToItem({
      columnIndex: 0,
      rowIndex: 0,
    });
  };

  // Memoize filtering functions as they can get expensive if there are a lot of contributors
  getContributorsFilters = memoizeOne((coreContributors, financialContributors) => {
    if (financialContributors.length && coreContributors.length) {
      return ContributorsFilter.FILTERS_LIST;
    } else {
      return [];
    }
  });

  filterContributors = memoizeOne((coreContributors, financialContributors, filter) => {
    // Return the proper list
    if (filter === ContributorsFilter.CONTRIBUTOR_FILTERS.CORE) {
      return coreContributors;
    } else if (filter === ContributorsFilter.CONTRIBUTOR_FILTERS.FINANCIAL) {
      return financialContributors;
    } else {
      const coreContributorsIds = new Set(coreContributors.map(c => c.id));
      return [...coreContributors, ...financialContributors.filter(c => !coreContributorsIds.has(c.id))];
    }
  });

  getTitleFontSize(collectiveName) {
    if (collectiveName.length < 15) {
      return 48;
    } else if (collectiveName.length < 20) {
      return 40;
    } else {
      return 32;
    }
  }

  render() {
    const { collective, financialContributors, coreContributors, stats } = this.props;
    const { filter } = this.state;
    const filters = this.getContributorsFilters(coreContributors, financialContributors);
    const contributors = this.filterContributors(coreContributors, financialContributors, filter);
    const hasFilters = filters.length > 1;

    return (
      <MainContainer data-cy="Contributors" pb={4}>
        <ContainerSectionContent>
          <SectionTitle fontWeight="bold" fontSize={this.getTitleFontSize(collective.name)} lineHeight="1em">
            <FormattedMessage
              id="CollectivePage.AllOfUs"
              defaultMessage="{collectiveName} is all of us"
              values={{ collectiveName: collective.name }}
            />
          </SectionTitle>
          <H3 mb={3} fontWeight="normal" color="black.900">
            <FormattedMessage
              id="CollectivePage.OurContributors"
              defaultMessage="Our contributors {count}"
              values={{
                count: (
                  <Span color="black.600">{stats.backers.all + coreContributors.filter(c => !c.isBacker).length}</Span>
                ),
              }}
            />
          </H3>
          <P color="black.700" mb={4}>
            <FormattedMessage
              id="CollectivePage.ContributorsDescription"
              defaultMessage="Thank you for supporting {collectiveName}."
              values={{ collectiveName: collective.name }}
            />
          </P>
        </ContainerSectionContent>
        {hasFilters && (
          <Container maxWidth={Dimensions.MAX_SECTION_WIDTH} margin="0 auto">
            <ContributorsFilter.default
              selected={filter}
              onChange={this.setFilter}
              filters={filters}
              selectedButtonStyle="primary"
              px={Dimensions.PADDING_X}
            />
          </Container>
        )}
        <ContributorsGrid
          contributors={contributors}
          collectiveId={collective.id}
          currency={collective.currency}
          maxWidthWhenNotFull={Dimensions.MAX_SECTION_WIDTH}
          gridRef={this.contributorsGridRef}
        />
      </MainContainer>
    );
  }
}
