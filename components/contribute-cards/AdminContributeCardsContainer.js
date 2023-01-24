import React from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import ContributeCardsContainer from '../collective-page/ContributeCardsContainer';
import EditTierModal from '../edit-collective/tiers/EditTierModal';

import ContributeCardContainer from './ContributeCardContainer';
import CreateNew from './CreateNew';
import DraggableContributeCardWrapper from './DraggableContributeCardWrapper';

/**
 * Display a list of contribution cards wrapped in a DragAndDrop provider
 */
const AdminContributeCardsContainer = ({
  collective,
  cards,
  onContributionCardMove,
  onContributionCardDrop,
  onMount,
  CardsContainer,
  useTierModals,
  enableReordering,
  createNewType,
  onTierUpdate,
}) => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const isEvent = collective.type === CollectiveType.EVENT;
  const createContributionTierRoute = isEvent
    ? `/${collective.parentCollective?.slug || 'collective'}/events/${collective.slug}/admin/tiers`
    : `/${collective.slug}/admin/tiers`;
  const addNewMessage =
    createNewType === 'TICKET' ? (
      <FormattedMessage id="SectionTickets.CreateTicket" defaultMessage="Create Ticket" />
    ) : (
      <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
    );

  React.useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  return (
    <DndProvider backend={HTML5Backend}>
      <CardsContainer>
        {cards.map(({ key, Component, componentProps }, index) => (
          <ContributeCardContainer key={key}>
            {cards.length === 1 || !enableReordering ? (
              // TODO Add edit button here
              <Component {...componentProps} />
            ) : (
              <DraggableContributeCardWrapper
                Component={Component}
                componentProps={componentProps}
                index={index}
                onMove={onContributionCardMove}
                onDrop={onContributionCardDrop}
              />
            )}
          </ContributeCardContainer>
        ))}
        <ContributeCardContainer>
          {useTierModals ? (
            <CreateNew as="div" data-cy="create-contribute-tier" onClick={() => setShowCreateModal(true)}>
              {addNewMessage}
            </CreateNew>
          ) : (
            <CreateNew data-cy="create-contribute-tier" route={createContributionTierRoute}>
              {addNewMessage}
            </CreateNew>
          )}
        </ContributeCardContainer>
        {showCreateModal && (
          <EditTierModal
            collective={collective}
            onClose={() => setShowCreateModal(false)}
            forcedType={createNewType}
            onUpdate={onTierUpdate}
          />
        )}
      </CardsContainer>
    </DndProvider>
  );
};

AdminContributeCardsContainer.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ).isRequired,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
  /** Whether to use the new modals to edit/create tiers */ useTierModals: PropTypes.bool,
  onContributionCardMove: PropTypes.func,
  onContributionCardDrop: PropTypes.func,
  onMount: PropTypes.func,
  CardsContainer: PropTypes.node,
  createNewType: PropTypes.string,
  enableReordering: PropTypes.bool,
  onTierUpdate: PropTypes.func,
};

AdminContributeCardsContainer.defaultProps = {
  CardsContainer: ContributeCardsContainer,
  enableReordering: true,
};

export default AdminContributeCardsContainer;
