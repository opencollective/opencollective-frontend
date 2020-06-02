import React from 'react';
import PropTypes from 'prop-types';
import { Move as MoveIcon } from '@styled-icons/feather/Move';
import { useDrag, useDrop } from 'react-dnd';
import styled, { css } from 'styled-components';

const MainContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;

  & > * {
    transition: opacity 0.2s;
  }

  ${props =>
    props.isDragging &&
    css`
      border: 1px solid #99c9ff;
      background: #f0f8ff;
      border-radius: 16px;
      & > * {
        opacity: 0;
      }
    `}
`;

const DragHandle = React.forwardRef((props, ref) => (
  <div {...props} ref={ref}>
    <MoveIcon size={10} />
  </div>
));

DragHandle.displayName = 'DragHandle';

const StyledDragHandle = styled(DragHandle)`
  position: absolute;
  cursor: move;
  top: 8px;
  margin-left: 270px;
  box-shadow: 0px 4px 6px rgba(26, 27, 31, 0.16);
  height: 32px;
  width: 32px;
  background: white;
  border: 1px solid #dcdee0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background: #f7f8fa;
  }
`;

const ITEM_TYPE = 'ContributeCard';

/**
 * A wrapper arround contribute cards that makes them draggable
 */
const DraggableContributeCardWrapper = ({ Component, componentProps, index, onMove, onDrop }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: item => onMove(item.index, index),
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ITEM_TYPE, index },
    end: item => onDrop(item.index, index),
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <MainContainer ref={preview} isDragging={isDragging}>
      <Component {...componentProps} />
      <StyledDragHandle ref={ref} />
    </MainContainer>
  );
};

DraggableContributeCardWrapper.propTypes = {
  index: PropTypes.number.isRequired,
  onMove: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  Component: PropTypes.any.isRequired,
  componentProps: PropTypes.object,
};

export default DraggableContributeCardWrapper;
