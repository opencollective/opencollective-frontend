import React from 'react';
import PropTypes from 'prop-types';
import { partition } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import { isPastEvent } from '../../../lib/events';

import { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeCollective from '../../contribute-cards/ContributeCollective';
import ContributeEvent from '../../contribute-cards/ContributeEvent';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { H3 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import SectionHeader from '../SectionHeader';

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
    connectedCollectives: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        collective: PropTypes.shape({
          id: PropTypes.number.isRequired,
        }),
      }),
    ),

    isAdmin: PropTypes.bool.isRequired,
    section: PropTypes.string,
  };

  triageEvents = memoizeOne(events => {
    return partition(events, isPastEvent);
  });

  render() {
    const { collective, events, connectedCollectives, isAdmin, section } = this.props;
    const hasNoContributorForEvents = !events.find(event => event.contributors.length > 0);
    const [pastEvents, upcomingEvents] = this.triageEvents(events);

    return (
      <ContainerSectionContent pt={5} pb={3}>
        <SectionHeader
          section={section}
          subtitle={<FormattedMessage id="section.events.subtitle" defaultMessage="Create and manage events" />}
          info={
            <FormattedMessage
              id="section.connect.info"
              defaultMessage="Start conversations with your community or share updates on how things are going."
            />
          }
        />
        <HorizontalScroller getScrollDistance={this.getContributeCardsScrollDistance}>
          {(ref, Chevrons) => (
            <div>
              <ContainerSectionContent>
                <Flex justifyContent="space-between" alignItems="center" mb={3}>
                  <H3 fontSize="20px" fontWeight="600" color="black.700">
                    {connectedCollectives.length > 0 ? (
                      <FormattedMessage id="SectionContribute.MoreWays" defaultMessage="More ways to contribute" />
                    ) : (
                      <FormattedMessage id="Events" defaultMessage="Events" />
                    )}
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
                {connectedCollectives.map(({ id, collective }) => (
                  <Box key={id} px={CONTRIBUTE_CARD_PADDING_X}>
                    <ContributeCollective collective={collective} />
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
        <Link route="contribute" params={{ collectiveSlug: collective.slug, verb: 'contribute' }}>
          <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
            <FormattedMessage id="CollectivePage.SectionEvents.ViewAll" defaultMessage="View all events" /> →
          </StyledButton>
        </Link>
      </ContainerSectionContent>
    );
  }
}

export default injectIntl(SectionEvents);
