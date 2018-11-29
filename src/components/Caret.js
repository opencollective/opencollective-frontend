import PropTypes from 'prop-types';
import styled from 'styled-components';
import { display, height, width, style } from 'styled-system';

const cursor = style({
  prop: 'cursor',
});

/**
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const Caret = styled.div`
  position: relative;

  ${display}
  ${height}
  ${width}

  ${cursor}

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

Caret.displayName = 'Caret';

Caret.propTypes = {
  /** Background color to match parent background */
  bgColor: PropTypes.string,
  /** Color of the caret stroke */
  color: PropTypes.string,
  /** From styled-system: accepts any css 'display' value */
  display: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** Use relative sizing for best results, i.e. 1rem */
  height: PropTypes.string.isRequired,
  /** Use relative sizing for best results, i.e. 0.4rem */
  strokeWidth: PropTypes.string.isRequired,
};

Caret.defaultProps = {
  bgColor: 'white',
  color: 'black',
};

/** @component */
export default Caret;
