import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { partition } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import { isPastEvent } from '../../../lib/events';

import { Sections } from '../_constants';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/Contribute';
import { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeCollective from '../../contribute-cards/ContributeCollective';
import ContributeEvent from '../../contribute-cards/ContributeEvent';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import SectionHeader from '../SectionHeader';

import eventsSectionHeaderIcon from '../../../public/static/images/collective-navigation/CollectiveSectionHeaderIconEvents.png';

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
    const { collective, events, connectedCollectives, isAdmin } = this.props;
    const hasNoContributorForEvents = !events.find(event => event.contributors.length > 0);
    const [pastEvents, upcomingEvents] = this.triageEvents(events);

    return (
      <Fragment>
        <ContainerSectionContent pt={5}>
          <SectionHeader
            title={Sections.EVENTS}
            subtitle={<FormattedMessage id="section.events.subtitle" defaultMessage="Create and manage events" />}
            info={
              <FormattedMessage
                id="section.events.info"
                defaultMessage="Find out where your community is gathering next."
              />
            }
            illustrationSrc={eventsSectionHeaderIcon}
          />
        </ContainerSectionContent>

        <HorizontalScroller getScrollDistance={this.getContributeCardsScrollDistance}>
          {(ref, Chevrons) => (
            <div>
              <ContainerSectionContent>
                <Flex justifyContent="flex-end" alignItems="center" mb={3}>
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
        <ContainerSectionContent>
          <Link route="contribute" params={{ collectiveSlug: collective.slug, verb: 'contribute' }}>
            <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
              <FormattedMessage id="CollectivePage.SectionEvents.ViewAll" defaultMessage="View all events" /> →
            </StyledButton>
          </Link>
        </ContainerSectionContent>
      </Fragment>
    );
  }
}

export default injectIntl(SectionEvents);
