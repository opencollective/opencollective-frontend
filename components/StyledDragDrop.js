import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import { union } from 'lodash';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled, { css } from 'styled-components';
import colors from '../lib/constants/colors';

const DirectionBox = styled.div`
  display: ${({ direction }) => (direction === 'vertical' ? 'block' : 'flex')};
`;

const Container = styled.div`
  :hover > [data-dom='dragmenu'] {
    opacity: ${({ draggingOverWith }) => (draggingOverWith ? 0 : 1)};
  }
  > [data-dom='dragmenu'] {
    opacity: ${({ showDragMenu }) => (showDragMenu ? 1 : 0)};
  }
  position: relative;
`;

const DragMenu = styled.div`
  transition: opacity 0.3s ease-out;
  justify-content: space-evenly;
  flex-direction: column;
  align-items: center;
  position: absolute;
  outline: none;
  /* height: 35%; */
  z-index: 1;
  /* width: 10%; */
  right: 0;
  top: 0;
`;

const defaultIdentifier = item => item.id;

const getAllItemsOrder = memoizeOne((items, itemsOrder, identifer) => {
  return union(itemsOrder.concat(items.map(identifer)));
});

const orderByItemsOrder = memoizeOne((items, itemsOrder, identifier) => {
  const excluded = items.filter(item => !itemsOrder.includes(identifier(item)));
  const _sortedItems = [];
  for (const id of itemsOrder) {
    const found = items.find(item => identifier(item) === id);
    if (!found) continue;
    _sortedItems.push(found);
  }
  return _sortedItems.concat(excluded);
});

const reorder = (items, startIndex, endIndex) => {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const RenderChildren = memoizeOne(({ sortedItems, children, handle, snapshot: ParentSnapshot }) => {
  const { draggingOverWith } = ParentSnapshot;

  return sortedItems.map((item, index) => (
    <Draggable key={item.id} draggableId={`${item.id}`} index={index}>
      {(provided, { isDragging }) => {
        const showDragmenu = Number(draggingOverWith) === item.id;

        const cssHelper = css`
          border: ${isDragging ? `1px solid ${colors.black}` : null};
          background-color: ${colors.white};
          transition: border 1s ease-out;
          /* help lap border radius */
          border-radius: 17px;
          &:hover {
            border: ${showDragmenu
              ? `1px solid ${colors.black}`
              : !isDragging && !draggingOverWith
              ? `1px solid ${colors.black}`
              : null};
          }
        `;

        const useHandle = !handle ? { ...provided.dragHandleProps } : {};
        const handleProps = !handle
          ? 'handle option needs to be enabled'
          : {
              // eslint-disable-next-line react/display-name
              wrapper: (...elem) => <DragMenu data-dom="dragmenu">{elem}</DragMenu>,
              dragProps: provided.dragHandleProps,
              hideDuringDrag: draggingOverWith,
            };

        return (
          <Container
            key={item.id}
            ref={provided.innerRef}
            showDragMenu={showDragmenu}
            draggingOverWith={draggingOverWith}
            {...provided.draggableProps}
            {...useHandle}
          >
            {children({ item, index, cssHelper, handleProps, isDragging })}
          </Container>
        );
      }}
    </Draggable>
  ));
});

/**
 * Styled Drag Panel -
 * Display card list sorted by handle
 * @param {*} param
 * @param {*} param.children - children is a function called passing in arguments
 * @param {*} param.children.item - each individual item to render
 * @param {*} param.children.index - item index
 * @param {*} param.children.cssHelper - css style for border etc.
 * @param {*} param.children.handleProps - custom handle props
 * @param {*} param.children.handleProps.wrapper - function receives handles return wrapped handles
 * @param {*} param.children.handleProps.dragProps - make one or more handle the draggable controller
 * @param {*} param.children.handleProps.hideDuringDrag - return true when dragging event is true
 */
const StyledDragDrop = ({
  id,
  items,
  children,
  onShuffle,
  itemsOrder,
  handle = false,
  direction = 'vertical',
  identifier = defaultIdentifier,
}) => {
  const [confirmedItemsOrder, setConfirmedItemsOrder] = useState([]);
  const [sortedItems, setSortedItems] = useState([]);

  useEffect(() => {
    setConfirmedItemsOrder(getAllItemsOrder(items, itemsOrder, identifier));
    setSortedItems(orderByItemsOrder(items, confirmedItemsOrder, identifier));
  }, [items]);

  const onDragEnd = memoizeOne(result => {
    const { source, destination } = result;

    if (!destination) return;
    if (destination.index === source.index) return;
    if (destination.droppableId !== source.droppableId) return;

    const _sortedItems = reorder(sortedItems, source.index, destination.index);
    setSortedItems(_sortedItems);

    const _sortedItemsId = _sortedItems.map(identifier);
    setConfirmedItemsOrder(_sortedItemsId);
    onShuffle(_sortedItemsId);
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`${id}`} direction={direction}>
        {(provided, snapshot) => (
          <DirectionBox ref={provided.innerRef} direction={direction} {...provided.droppableProps}>
            {RenderChildren({ sortedItems, children, handle, provided, snapshot })}
            {provided.placeholder}
          </DirectionBox>
        )}
      </Droppable>
    </DragDropContext>
  );
};

StyledDragDrop.propTypes = {
  handle: PropTypes.bool,
  /** item.id === 1101 and itemOrder === something-1101. identifer is used to match/convert item.id with itemOrder*/
  identifier: PropTypes.func,
  direction: PropTypes.string,
  /** Unique ID for the List */
  id: PropTypes.number.isRequired,
  /** {id, any?}[] */
  items: PropTypes.array.isRequired,
  /**
   * ({ item, index, cssHelper, handleProps })
   */
  children: PropTypes.func.isRequired,
  /** (newItemOrder) => void */
  onShuffle: PropTypes.func.isRequired,
  /** Number[] */
  itemsOrder: PropTypes.array.isRequired,
};

export default React.memo(StyledDragDrop);
