import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Move as MoveIcon } from '@styled-icons/feather/Move';
import styled, { css } from 'styled-components';

import StyledRoundButton from '../StyledRoundButton';

const MainContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;

  ${props =>
    props.isDragging &&
    css`
      outline: 1px solid #99c9ff;
      background: #f0f8ff;
      border-radius: 16px;
      & > * {
        opacity: 0;
      }
    `}

  ${props =>
    props.isDragOverlay &&
    css`
      box-shadow: 0px 4px 6px rgba(26, 27, 31, 0.16);
      border-radius: 16px;
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

export const ContributeCardWithDragHandle = ({ Component, componentProps, dragHandleProps, isDragOverlay }) => {
  return (
    <MainContainer isDragOverlay={isDragOverlay}>
      <Component {...componentProps} />
      <StyledDragHandle {...dragHandleProps} />
    </MainContainer>
  );
};

ContributeCardWithDragHandle.propTypes = {
  Component: PropTypes.any.isRequired,
  componentProps: PropTypes.object,
  dragHandleProps: PropTypes.object,
  isDragOverlay: PropTypes.bool,
};

// Memoized for improved performance when dragging
const MemoizedContributeCardWithDragHandle = memo(ContributeCardWithDragHandle);

/**
 * A wrapper arround contribute cards that makes them draggable
 */
export default function DraggableContributeCardWrapper(props) {
  const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MainContainer ref={setNodeRef} style={style} isDragging={isDragging}>
      <MemoizedContributeCardWithDragHandle dragHandleProps={{ ...attributes, ...listeners }} {...props} />
    </MainContainer>
  );
}

DraggableContributeCardWrapper.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Component: PropTypes.any.isRequired,
  componentProps: PropTypes.object,
};
