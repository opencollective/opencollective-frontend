import styled from 'styled-components';
import {
  display,
  height,
  width,
} from 'styled-system';

const Caret = styled.div`
  position: relative;

  ${display}
  ${height}
  ${width}

  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
  }

  &::before {
    border-left: ${props => `${props.height} solid transparent`};
    border-right: ${props => `${props.height} solid transparent`};
    border-top: ${props => `${props.height} solid ${props.color || 'black'}`};
    left: 0;
  }

  &::after {
    border-left: ${props => `calc(${props.height} - ${props.strokeWidth}) solid transparent`};
    border-right: ${props => `calc(${props.height} - ${props.strokeWidth}) solid transparent`};
    border-top: ${props => `calc(${props.height} - ${props.strokeWidth}) solid ${props.bgColor || 'white'}`};
    left: ${props => props.strokeWidth}
  }
`;

export default Caret;
