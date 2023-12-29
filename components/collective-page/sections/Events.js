import React from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import { sortEvents } from '../../../lib/events';

import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeEvent from '../../contribute-cards/ContributeEvent';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { H3, P } from '../../Text';
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

  sortEvents = memoizeOne(sortEvents);

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
    if (!events?.length && !isAdmin) {
      return null;
    }

    const hasNoContributorForEvents = !events.find(event => event.contributors.length > 0);
    return (
      <Box pb={4} mt={2}>
        <ContainerSectionContent>
          <H3 fontSize={['20px', '24px', '32px']} fontWeight="normal" color="black.700" mb={2}>
            <FormattedMessage id="Events" defaultMessage="Events" />
          </H3>
          <P color="black.700" mb={4}>
            {isAdmin ? (
              <FormattedMessage
                id="CollectivePage.SectionEvents.AdminDescription"
                defaultMessage="Set up events for your community and sell tickets that go straight to your budget."
              />
            ) : (
              <FormattedMessage
                id="CollectivePage.SectionEvents.Description"
                defaultMessage="{collectiveName} is hosting the following events."
                values={{ collectiveName: collective.name }}
              />
            )}
          </P>
        </ContainerSectionContent>
        <HorizontalScroller
          container={ContributeCardsContainer}
          getScrollDistance={this.getContributeCardsScrollDistance}
        >
          {this.sortEvents(events).map(event => (
            <Box key={event.id} px={CONTRIBUTE_CARD_PADDING_X}>
              <ContributeEvent collective={collective} event={event} hideContributors={hasNoContributorForEvents} />
            </Box>
          ))}
          {isAdmin && (
            <Box px={CONTRIBUTE_CARD_PADDING_X} minHeight={150}>
              <CreateNew route={`/${collective.slug}/events/create`} data-cy="create-event">
                <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />
              </CreateNew>
            </Box>
          )}
        </HorizontalScroller>
        {Boolean(events.length > 6) && (
          <ContainerSectionContent>
            <Link href={`/${collective.slug}/events`}>
              <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="CollectivePage.SectionEvents.ViewAll" defaultMessage="View all events" /> →
              </StyledButton>
            </Link>
          </ContainerSectionContent>
        )}
      </Box>
    );
  }
}

export default injectIntl(SectionEvents);
