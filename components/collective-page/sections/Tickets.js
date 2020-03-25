import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';
import { orderBy } from 'lodash';
import styled from 'styled-components';
import css from '@styled-system/css';

import { CollectiveType } from '../../../lib/constants/collectives';
import { TierTypes } from '../../../lib/constants/tiers-types';
import HorizontalScroller from '../../HorizontalScroller';
import ContributeTier from '../../contribute-cards/ContributeTier';
import CreateNew from '../../contribute-cards/CreateNew';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/Contribute';
import ContributeCardsContainer from '../ContributeCardsContainer';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

const CONTRIBUTE_CARD_PADDING_X = [15, 18];

const ContributeCardContainer = styled(Box).attrs({ px: CONTRIBUTE_CARD_PADDING_X })(
  css({
    scrollSnapAlign: ['center', null, 'start'],
  }),
);

/**
 * The tickets section, implemented as a pure component to avoid unnecessary
 * re-renders when scrolling.
 */
class SectionTickets extends React.PureComponent {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string,
      isActive: PropTypes.bool,
      parentCollective: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
    }),
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        isBacker: PropTypes.bool,
        tiersIds: PropTypes.arrayOf(PropTypes.number),
      }),
    ),
    isAdmin: PropTypes.bool,
  };

  hasContributors = memoizeOne(contributors => {
    return contributors.find(c => c.isBacker);
  });

  sortTiers = memoizeOne(tiers => {
    return orderBy([...tiers], ['endsAt'], ['desc']);
  });

  filterTickets = memoizeOne(tiers => {
    return tiers.filter(tier => tier.type == TierTypes.TICKET);
  });

  getContributeCardsScrollDistance(width) {
    const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
    if (width <= oneCardScrollDistance * 2) {
      return oneCardScrollDistance;
    } else if (width <= oneCardScrollDistance * 4) {
      return oneCardScrollDistance * 2;
    } else {
      return oneCardScrollDistance * 3;
    }
  }

  render() {
    const { collective, tiers, contributors, isAdmin } = this.props;
    const hasNoContributor = !this.hasContributors(contributors);
    const sortedTiers = this.sortTiers(this.filterTickets(tiers));

    if ((sortedTiers.length === 0 || !collective.isActive) && !isAdmin) {
      return null;
    }

    return (
      <Box pt={[4, 5]} data-cy="Tickets">
        <ContainerSectionContent>
          <SectionTitle>
            <FormattedMessage id="section.tickets.title" defaultMessage="Tickets" />
          </SectionTitle>
        </ContainerSectionContent>

        <Box mb={4}>
          <HorizontalScroller getScrollDistance={this.getContributeCardsScrollDistance}>
            {(ref, Chevrons) => (
              <div>
                <ContainerSectionContent>
                  <Flex justifyContent="space-between" alignItems="center" mb={3}>
                    <Box m={2} flex="0 0 50px">
                      <Chevrons />
                    </Box>
                  </Flex>
                </ContainerSectionContent>

                <ContributeCardsContainer ref={ref}>
                  {sortedTiers.map(tier => (
                    <ContributeCardContainer key={tier.id}>
                      <ContributeTier
                        collective={collective}
                        tier={tier}
                        hideContributors={hasNoContributor}
                        disableCTA={!collective.isActive}
                      />
                    </ContributeCardContainer>
                  ))}
                  {isAdmin && (
                    <ContributeCardContainer minHeight={150}>
                      <CreateNew route={`/${collective.parentCollective.slug}/events/${collective.slug}/edit/tiers`}>
                        <FormattedMessage id="SectionTickets.CreateTicket" defaultMessage="Create Ticket" />
                      </CreateNew>
                    </ContributeCardContainer>
                  )}
                </ContributeCardsContainer>
              </div>
            )}
          </HorizontalScroller>
        </Box>
      </Box>
    );
  }
}

export default SectionTickets;
