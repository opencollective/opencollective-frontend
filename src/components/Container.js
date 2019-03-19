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
  fontWeight,
  height,
  justifyContent,
  left,
  lineHeight,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  order,
  position,
  right,
  size,
  space,
  textAlign,
  top,
  width,
  zIndex,
} from 'styled-system';
import { cursor, clear, float, overflow, pointerEvents } from '../lib/styled_system_custom';

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
  ${fontWeight}
  ${float}
  ${fontSize}
  ${height}
  ${justifyContent}
  ${left}
  ${lineHeight}
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
  blacklist: tag.defaultProps.blacklist.concat('float', 'clear', 'clearfix', 'overflow'),
};

export default Container;
