import styled from 'styled-components';
import tag from 'clean-tag';
import {
  alignItems,
  alignSelf,
  background,
  backgroundImage,
  backgroundPosition,
  backgroundRepeat,
  backgroundSize,
  borders,
  borderColor,
  borderRadius,
  bottom,
  boxShadow,
  color,
  display,
  flex,
  flexDirection,
  flexWrap,
  fontSize,
  height,
  justifyContent,
  left,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  order,
  position,
  right,
  size,
  space,
  style,
  textAlign,
  top,
  width,
  zIndex,
} from 'styled-system';
import { cursor } from './Text';

export const overflow = style({ prop: 'overflow' });

export const pointerEvents = style({ prop: 'pointerEvents' });

export const float = style({ prop: 'float' });
export const clear = style({ prop: 'clear' });

const Container = styled(tag)`
  box-sizing: border-box;

  ${alignItems}
  ${alignSelf}
  ${background}
  ${backgroundImage}
  ${backgroundPosition}
  ${backgroundRepeat}
  ${backgroundSize}
  ${borders}
  ${borderColor}
  ${borderRadius}
  ${bottom}
  ${boxShadow}
  ${clear}
  ${color}
  ${cursor}
  ${display}
  ${flex}
  ${flexDirection}
  ${flexWrap}
  ${float}
  ${fontSize}
  ${height}
  ${justifyContent}
  ${left}
  ${maxHeight}
  ${maxWidth}
  ${minHeight}
  ${minWidth}
  ${order}
  ${overflow}
  ${pointerEvents}
  ${position}
  ${right}
  ${size}
  ${space}
  ${top}
  ${textAlign}
  ${width}
  ${zIndex}
  ${props =>
    props.clearfix &&
    `
      ::after {
        content: "";
        display: table;
        clear: both;
      }
    `}
`;

Container.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('float', 'clear', 'clearfix'),
};

export default Container;
