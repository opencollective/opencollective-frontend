import React from 'react';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { isEqual } from 'lodash';
import { FormattedMessage } from 'react-intl';

import ContributeCardsContainer from '../collective-page/ContributeCardsContainer';
import ContainerOverlay from '../ContainerOverlay';
import EditTierModal from '../edit-collective/tiers/EditTierModal';
import Spinner from '../Spinner';

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
  onMount = undefined,
  CardsContainer = ContributeCardsContainer,
  enableReordering = true,
  createNewType = undefined,
  onTierUpdate = undefined,
  canEdit = false,
  isSaving,
  useTierModals = true,
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
  const closeTierModal = React.useCallback(() => setShowTierModal(false), [setShowTierModal]);

  const addNewMessage =
    createNewType === 'TICKET' ? (
      <FormattedMessage id="SectionTickets.CreateTicket" defaultMessage="Create Ticket" />
    ) : createNewType === 'PROJECT' ? (
      <FormattedMessage id="SectionProjects.CreateProject" defaultMessage="Create Project" />
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
        <div className="relative">
          <CardsContainer>
            {isSaving && (
              <ContainerOverlay position="absolute" top={0} alignItems="center">
                <Spinner size={64} />
                <p className="mt-3 text-sm">
                  <FormattedMessage id="Saving" defaultMessage="Saving..." />
                </p>
              </ContainerOverlay>
            )}
            {items.map(({ key, Component, componentProps }) => {
              // Add onClickEdit to the component props if we're using tier modals
              componentProps =
                canEdit && useTierModals && componentProps.tier
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
              {createNewType === 'PROJECT' ? (
                <CreateNew data-cy="create-project" route={`/${collective.slug}/projects/create`}>
                  {addNewMessage}
                </CreateNew>
              ) : useTierModals ? (
                <CreateNew
                  as="div"
                  data-cy={createNewType === 'TICKET' ? 'create-ticket' : 'create-contribute-tier'}
                  onClick={() => setShowTierModal('new')}
                >
                  {addNewMessage}
                </CreateNew>
              ) : createNewType === 'TICKET' ? (
                <CreateNew data-cy="create-ticket" route={`/dashboard/${collective.slug}/tickets`}>
                  {addNewMessage}
                </CreateNew>
              ) : (
                <CreateNew data-cy="create-contribute-tier" route={`/dashboard/${collective.slug}/tiers`}>
                  {addNewMessage}
                </CreateNew>
              )}
            </ContributeCardContainer>
            {showTierModal && (
              <EditTierModal
                tier={showTierModal === 'new' ? null : showTierModal}
                collective={collective}
                onClose={closeTierModal}
                forcedType={createNewType}
                onUpdate={onTierUpdate}
              />
            )}
          </CardsContainer>
        </div>
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

export default AdminContributeCardsContainer;
