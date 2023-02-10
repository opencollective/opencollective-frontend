import React from 'react';
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
const DraggableContributeCardWrapper = ({ Component, componentProps, id }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MainContainer ref={setNodeRef} style={style} isDragging={isDragging}>
      <Component {...componentProps} />
      <StyledDragHandle {...attributes} {...listeners} />
    </MainContainer>
  );
};

DraggableContributeCardWrapper.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Component: PropTypes.any.isRequired,
  componentProps: PropTypes.object,
};

export default DraggableContributeCardWrapper;
