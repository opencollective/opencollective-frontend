import React from 'react';
import PropTypes from 'prop-types';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { isEqual } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import ContributeCardsContainer from '../collective-page/ContributeCardsContainer';
import EditTierModal from '../edit-collective/tiers/EditTierModal';

import ContributeCardContainer from './ContributeCardContainer';
import CreateNew from './CreateNew';
import DraggableContributeCardWrapper, { ContributeCardWithDragHandle } from './DraggableContributeCardWrapper';

/**
 * Display a list of contribution cards wrapped in a DragAndDrop provider
 */
const AdminContributeCardsContainer = ({
  collective,
  cards,
  onReorder,
  draggingId,
  setDraggingId,
  onMount,
  CardsContainer,
  useTierModals,
  enableReordering,
  createNewType,
  onTierUpdate,
}) => {
  const [items, setItems] = React.useState(cards || []);

  // Reset items if the cards order have changed
  React.useEffect(() => {
    if (!isEqual(cards, items)) {
      setItems(cards);
    }
  }, [JSON.stringify(cards)]);

  // Save reorder to the backend if internal order has changed
  React.useEffect(() => {
    if (!isEqual(cards, items)) {
      onReorder?.(items);
    }
  }, [items]);

  function handleDragStart(event) {
    setDraggingId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems(items => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setDraggingId(null);
  }

  const [showTierModal, setShowTierModal] = React.useState(false);
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

  const draggingItem = items.find(i => i.key === draggingId);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <SortableContext items={items.map(c => c.key)} strategy={horizontalListSortingStrategy}>
        <CardsContainer>
          {items.map(({ key, Component, componentProps }) => {
            // Add onClickEdit to the component props if we're using tier modals
            componentProps =
              useTierModals && componentProps.tier
                ? { ...componentProps, onClickEdit: () => setShowTierModal(componentProps.tier) }
                : componentProps;

            return (
              <ContributeCardContainer key={key}>
                {cards.length === 1 || !enableReordering ? (
                  <Component {...componentProps} />
                ) : (
                  <DraggableContributeCardWrapper Component={Component} componentProps={componentProps} id={key} />
                )}
              </ContributeCardContainer>
            );
          })}
          <ContributeCardContainer>
            {useTierModals ? (
              <CreateNew
                as="div"
                data-cy={createNewType === 'TICKET' ? 'create-ticket' : 'create-contribute-tier'}
                onClick={() => setShowTierModal('new')}
              >
                {addNewMessage}
              </CreateNew>
            ) : (
              <CreateNew
                data-cy={createNewType === 'TICKET' ? 'create-ticket' : 'create-contribute-tier'}
                route={createContributionTierRoute}
              >
                {addNewMessage}
              </CreateNew>
            )}
          </ContributeCardContainer>
          {showTierModal && (
            <EditTierModal
              tier={showTierModal === 'new' ? null : showTierModal}
              collective={collective}
              onClose={() => setShowTierModal(false)}
              forcedType={createNewType}
              onUpdate={onTierUpdate}
            />
          )}
        </CardsContainer>
        <DragOverlay>
          {draggingItem ? (
            <ContributeCardWithDragHandle
              Component={draggingItem.Component}
              componentProps={draggingItem.componentProps}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </SortableContext>
    </DndContext>
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
  onReorder: PropTypes.func,
  setDraggingId: PropTypes.func,
  draggingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onMount: PropTypes.func,
  CardsContainer: PropTypes.elementType,
  createNewType: PropTypes.string,
  enableReordering: PropTypes.bool,
  onTierUpdate: PropTypes.func,
};

AdminContributeCardsContainer.defaultProps = {
  CardsContainer: ContributeCardsContainer,
  enableReordering: true,
};

export default AdminContributeCardsContainer;
