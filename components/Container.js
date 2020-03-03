import styled from 'styled-components';
import { background, border, flexbox, shadow, color, position, layout, space, typography } from 'styled-system';
import { cursor, clear, float, overflow, pointerEvents, whiteSpace } from '../lib/styled-system-custom-properties';
import propTypes from '@styled-system/prop-types';

const Container = styled.div`
  box-sizing: border-box;

  ${flexbox}
  ${background}
  ${border}
  ${shadow}
  ${clear}
  ${color}
  ${cursor}
  ${float}
  ${overflow}
  ${pointerEvents}
  ${position}
  ${layout}
  ${space}
  ${typography}
  ${whiteSpace}
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

Container.propTypes = {
  ...propTypes.background,
  ...propTypes.border,
  ...propTypes.color,
  ...propTypes.flexbox,
  ...propTypes.layout,
  ...propTypes.position,
  ...propTypes.shadow,
  ...propTypes.space,
  ...propTypes.typography,
};

export default Container;
