import React from 'react';
import PropTypes from 'prop-types';
import { partition } from 'lodash';
import memoizeOne from 'memoize-one';
import NextLink from 'next/link';
import { FormattedMessage, injectIntl } from 'react-intl';

import { isPastEvent } from '../../../lib/events';

import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/Contribute';
import { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeEvent from '../../contribute-cards/ContributeEvent';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import StyledButton from '../../StyledButton';
import { H3 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';

class SectionEvents extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
    }).isRequired,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.object),
      }),
    ),
    isAdmin: PropTypes.bool.isRequired,
  };

  triageEvents = memoizeOne(events => {
    return partition(events, isPastEvent);
  });

  getContributeCardsScrollDistance = width => {
    const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
    if (width <= oneCardScrollDistance * 2) {
      return oneCardScrollDistance;
    } else if (width <= oneCardScrollDistance * 4) {
      return oneCardScrollDistance * 2;
    } else {
      return oneCardScrollDistance * 3;
    }
  };

  render() {
    const { collective, events, isAdmin } = this.props;
    const hasNoContributorForEvents = !events.find(event => event.contributors.length > 0);
    const [pastEvents, upcomingEvents] = this.triageEvents(events);

    if (!events?.length && !isAdmin) {
      return null;
    }

    return (
      <Box pb={4}>
        <HorizontalScroller getScrollDistance={this.getContributeCardsScrollDistance}>
          {(ref, Chevrons) => (
            <div>
              <ContainerSectionContent pb={3}>
                <Flex justifyContent="space-between" alignItems="center">
                  <H3 fontSize={['20px', '24px', '32px']} fontWeight="normal" color="black.700">
                    <FormattedMessage id="Events" defaultMessage="Events" />
                  </H3>
                  <Box m={2} flex="0 0 50px">
                    <Chevrons />
                  </Box>
                </Flex>
              </ContainerSectionContent>

              <ContributeCardsContainer ref={ref}>
                {isAdmin && (
                  <Box px={CONTRIBUTE_CARD_PADDING_X} minHeight={150}>
                    <CreateNew route={`/${collective.slug}/events/create`} data-cy="create-event">
                      <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />
                    </CreateNew>
                  </Box>
                )}
                {upcomingEvents.map(event => (
                  <Box key={event.id} px={CONTRIBUTE_CARD_PADDING_X}>
                    <ContributeEvent
                      collective={collective}
                      event={event}
                      hideContributors={hasNoContributorForEvents}
                      disableCTA={!collective.isActive || !event.isActive}
                    />
                  </Box>
                ))}
                {pastEvents.map(event => (
                  <Box key={event.id} px={CONTRIBUTE_CARD_PADDING_X}>
                    <ContributeEvent
                      collective={collective}
                      event={event}
                      hideContributors={hasNoContributorForEvents}
                      disableCTA={!collective.isActive || !event.isActive}
                    />
                  </Box>
                ))}
              </ContributeCardsContainer>
            </div>
          )}
        </HorizontalScroller>
        {Boolean(events?.length) && (
          <ContainerSectionContent>
            <NextLink href={`${collective.slug}/contribute`}>
              <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="CollectivePage.SectionEvents.ViewAll" defaultMessage="View all events" /> →
              </StyledButton>
            </NextLink>
          </ContainerSectionContent>
        )}
      </Box>
    );
  }
}

export default injectIntl(SectionEvents);
