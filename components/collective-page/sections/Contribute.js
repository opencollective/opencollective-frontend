import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import memoizeOne from 'memoize-one';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { TierTypes } from '../../../lib/constants/tiers-types';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { isPastEvent } from '../../../lib/events';
import {
  getCollectiveTicketsOrder,
  sortTickets,
  sortTiersForCollective,
  TICKETS_ORDER_KEY,
  TIERS_ORDER_KEY,
} from '../../../lib/tier-utils';
import { getCollectivePageRoute } from '../../../lib/url-helpers';
import { updateCollectiveInGraphQLV1Cache } from '@/lib/collective';

import { ContributionCategoryPicker } from '@/components/accept-financial-contributions/ContributionCategoryPicker';

import Container from '../../Container';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import ContributeCardContainer, { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { H3 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import { editAccountSettingMutation } from '../graphql/mutations';
import SectionTitle from '../SectionTitle';

// Dynamic imports
const AdminContributeCardsContainer = dynamic(() => import('../../contribute-cards/AdminContributeCardsContainer'), {
  ssr: false,
});

/**
 * The contribute section, implemented as a pure component to avoid unnecessary
 * re-renders when scrolling.
 */
class SectionContribute extends React.PureComponent {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
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
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
      isHost: PropTypes.bool,
      host: PropTypes.object,
      currency: PropTypes.string,
      settings: PropTypes.object,
      parentCollective: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
      name: PropTypes.string,
    }),
    contributorsStats: PropTypes.object,
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        isBacker: PropTypes.bool,
        tiersIds: PropTypes.arrayOf(PropTypes.number),
      }),
    ),
    isAdmin: PropTypes.bool,
    editAccountSettings: PropTypes.func.isRequired,
  };

  state = {
    showTiersAdmin: false,
    showTicketsAdmin: false,
    isSaving: false,
    isSavingTickets: false,
    draggingId: null,
    draggingTicketId: null,
  };

  onTiersAdminReady = () => {
    this.setState({ showTiersAdmin: true });
  };

  onTicketsAdminReady = () => {
    this.setState({ showTicketsAdmin: true });
  };

  getFinancialContributorsWithoutTier = memoizeOne(contributors => {
    return contributors.filter(c => c.isBacker && (c.tiersIds.length === 0 || c.tiersIds[0] === null));
  });

  hasContributors = memoizeOne(contributors => {
    return contributors.find(c => c.isBacker);
  });

  onContributeCardsReorder = async cards => {
    const { collective, editAccountSettings } = this.props;
    const cardKeys = cards.map(c => c.key);

    // Save the new positions
    this.setState({ isSaving: true });
    try {
      const mutationVariables = { collectiveId: collective.id, key: TIERS_ORDER_KEY, value: cardKeys };
      await editAccountSettings({
        variables: mutationVariables,
        update: (store, response) => {
          // We need to update the store manually because the response comes from API V2
          updateCollectiveInGraphQLV1Cache(store, collective.id, {
            settings: response.data.editAccountSetting.settings,
          });
        },
      });
      this.setState({ isSaving: false });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSaving: false });
    }
  };

  onTicketsReorder = async cards => {
    const { collective, editAccountSettings } = this.props;
    const cardKeys = cards.map(c => c.key);

    // Save the new positions
    this.setState({ isSavingTickets: true });
    try {
      const mutationVariables = { collectiveId: collective.id, key: TICKETS_ORDER_KEY, value: cardKeys };
      await editAccountSettings({
        variables: mutationVariables,
        update: (store, response) => {
          // We need to update the store manually because the response comes from API V2
          updateCollectiveInGraphQLV1Cache(store, collective.id, {
            settings: response.data.editAccountSetting.settings,
          });
        },
      });
      this.setState({ isSavingTickets: false });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSavingTickets: false });
    }
  };

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

  getContributeCards = memoizeOne((collective, tiers) => {
    const { contributors, contributorsStats, isAdmin } = this.props;
    const hasNoContributor = !this.hasContributors(contributors);
    const canContribute = collective.isActive && (!isPastEvent(collective) || isAdmin);
    const sortedTiers = sortTiersForCollective(collective, tiers);
    return sortedTiers.map(tier => {
      if (tier === 'custom') {
        return {
          key: 'custom',
          Component: ContributeCustom,
          componentProps: {
            collective,
            contributors: this.getFinancialContributorsWithoutTier(contributors),
            stats: contributorsStats,
            hideContributors: hasNoContributor,
            disableCTA: !canContribute,
          },
        };
      } else {
        return {
          key: tier.id,
          Component: ContributeTier,
          componentProps: { collective, tier, hideContributors: hasNoContributor },
        };
      }
    });
  });

  sortTicketTiers = memoizeOne((tiers, orderKeys) => {
    return sortTickets(tiers, orderKeys);
  });

  filterTickets = memoizeOne(tiers => {
    return tiers.filter(tier => tier.type === TierTypes.TICKET);
  });

  getTicketCards = memoizeOne(tickets => {
    const { collective, contributors } = this.props;
    const hasNoContributor = !this.hasContributors(contributors);

    return tickets.map(tier => ({
      key: tier.id,
      Component: ContributeTier,
      componentProps: {
        collective,
        tier,
        hideContributors: hasNoContributor,
        disableCTA: !collective.isActive,
      },
    }));
  });

  render() {
    const { collective, tiers, events, connectedCollectives, contributors, isAdmin } = this.props;
    const { showTiersAdmin, showTicketsAdmin } = this.state;
    const isEvent = collective.type === CollectiveType.EVENT;
    const isProject = collective.type === CollectiveType.PROJECT;
    const isFund = collective.type === CollectiveType.FUND;
    const hasOtherWaysToContribute =
      !isEvent && !isProject && !isFund && (isAdmin || events.length > 0 || connectedCollectives.length > 0);
    const isActive = collective.isActive;
    const hasHost = collective.host;
    const isHost = collective.isHost;
    const contributeCards = this.getContributeCards(collective, tiers);
    const hasContribute = Boolean(isAdmin || (collective.isActive && contributeCards.length));
    const hasNoContributor = !this.hasContributors(contributors);
    const ticketTiers = this.filterTickets(tiers);
    const ticketOrderKeys = getCollectiveTicketsOrder(collective);
    const sortedTicketTiers = this.sortTicketTiers(ticketTiers, ticketOrderKeys);
    const hasTickets = isEvent && Boolean(isAdmin || (collective.isActive && sortedTicketTiers.length));
    const hideTicketsFromNonAdmins = (sortedTicketTiers.length === 0 || !collective.isActive) && !isAdmin;
    const cannotOrderTickets = (!hasTickets && !isAdmin) || isPastEvent(collective);

    /*
    cases

    1. admin + no host = Contribute Section and 'Start accepting financial contributions' ✅
    2a. admin + host = normal Contribute section ✅
    2b. not admin + Collective active = normal Contribute section ???
    3. not admin + Collective not active + no connectedcollectives/events = display nothing ✅
    */

    if (!hasContribute && !hasTickets && !hasOtherWaysToContribute) {
      return null;
    }

    return (
      <Fragment>
        {/* "Start accepting financial contributions" for admins */}
        {isAdmin && !hasHost && !isHost && (
          <ContainerSectionContent pb={6}>
            <ContributionCategoryPicker collective={collective} />
          </ContainerSectionContent>
        )}

        {((isAdmin && hasHost) || (isAdmin && isHost) || (!isAdmin && isActive)) && (
          <Fragment>
            {/* Financial contributions tiers */}
            {hasContribute && (
              <Fragment>
                <ContainerSectionContent>
                  <SectionTitle>
                    <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />
                  </SectionTitle>
                </ContainerSectionContent>
                <Box pb={4} data-cy="financial-contributions">
                  <HorizontalScroller
                    getScrollDistance={this.getContributeCardsScrollDistance}
                    container={ContributeCardsContainer}
                    containerProps={{ disableScrollSnapping: !!this.state.draggingId }}
                  >
                    <React.Fragment>
                      {!(isAdmin && showTiersAdmin) &&
                        contributeCards.map(({ key, Component, componentProps }) => (
                          <ContributeCardContainer key={key}>
                            <Component {...componentProps} />
                          </ContributeCardContainer>
                        ))}
                      {isAdmin && (
                        <Container display={showTiersAdmin ? 'block' : 'none'} data-cy="admin-contribute-cards">
                          <AdminContributeCardsContainer
                            collective={collective}
                            cards={contributeCards}
                            onReorder={this.onContributeCardsReorder}
                            isSaving={this.state.isSaving}
                            setDraggingId={draggingId => this.setState({ draggingId })}
                            draggingId={this.state.draggingId}
                            onMount={this.onTiersAdminReady}
                            useTierModals={false}
                          />
                        </Container>
                      )}
                    </React.Fragment>
                  </HorizontalScroller>
                </Box>
              </Fragment>
            )}

            {/* Tickets for type EVENT */}
            {isEvent && !cannotOrderTickets && !hideTicketsFromNonAdmins && (
              <Box pb={4} data-cy="Tickets">
                <ContainerSectionContent>
                  <Flex alignItems="left" mb={3}>
                    <H3 fontSize="20px" fontWeight="600" color="black.700">
                      <FormattedMessage id="section.tickets.title" defaultMessage="Tickets" />
                    </H3>
                  </Flex>
                </ContainerSectionContent>
                <HorizontalScroller
                  container={ContributeCardsContainer}
                  getScrollDistance={this.getContributeCardsScrollDistance}
                  containerProps={{ disableScrollSnapping: !!this.state.draggingTicketId }}
                >
                  <React.Fragment>
                    {!(isAdmin && showTicketsAdmin) &&
                      sortedTicketTiers.map(tier => (
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
                      <Container display={showTicketsAdmin ? 'block' : 'none'} data-cy="admin-tickets-cards">
                        <AdminContributeCardsContainer
                          collective={collective}
                          cards={this.getTicketCards(sortedTicketTiers)}
                          onReorder={this.onTicketsReorder}
                          isSaving={this.state.isSavingTickets}
                          setDraggingId={draggingTicketId => this.setState({ draggingTicketId })}
                          draggingId={this.state.draggingTicketId}
                          onMount={this.onTicketsAdminReady}
                          createNewType="TICKET"
                          useTierModals={false}
                        />
                      </Container>
                    )}
                  </React.Fragment>
                </HorizontalScroller>
              </Box>
            )}

            {/* "View all ways to contribute" button */}
            {(tiers.length > 6 || hasOtherWaysToContribute) && (
              <ContainerSectionContent pb={4}>
                <Link href={`${getCollectivePageRoute(collective)}/contribute`}>
                  <StyledButton mt={3} width={1} buttonSize="small" fontSize="14px">
                    <FormattedMessage id="SectionContribute.All" defaultMessage="All ways to contribute" /> →
                  </StyledButton>
                </Link>
              </ContainerSectionContent>
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }
}

const addEditAccountSettingMutation = graphql(editAccountSettingMutation, {
  name: 'editAccountSettings',
});

export default addEditAccountSettingMutation(SectionContribute);
