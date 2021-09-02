import React from 'react';
import PropTypes from 'prop-types';
import { Move as MoveIcon } from '@styled-icons/feather/Move';
import { useDrag, useDrop } from 'react-dnd';
import styled, { css } from 'styled-components';

import DRAG_AND_DROP_TYPES from '../../lib/constants/drag-and-drop';

import StyledRoundButton from '../StyledRoundButton';

const MainContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;

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
  <StyledRoundButton size={32} {...props} ref={ref}>
    <MoveIcon size={10} />
  </StyledRoundButton>
));

DragHandle.displayName = 'DragHandle';

const StyledDragHandle = styled(DragHandle)`
  position: absolute;
  cursor: move;
  top: 17px;
  margin-left: 270px;
  box-shadow: 0px 4px 6px rgba(26, 27, 31, 0.16);
  &:hover {
    color: ${props => props.theme.colors.primary[700]};
  }

  /** Hide on touchscreens */
  @media (hover: none) {
    display: none;
  }
`;

/**
 * A wrapper arround contribute cards that makes them draggable
 */
const DraggableContributeCardWrapper = ({ Component, componentProps, index, onMove, onDrop }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: DRAG_AND_DROP_TYPES.CONTRIBUTE_CARD,
    hover: item => onMove(item.index, index),
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: DRAG_AND_DROP_TYPES.CONTRIBUTE_CARD, index },
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
