import PropTypes from 'prop-types';
import styled from 'styled-components';
import { color, typography, variant } from 'styled-system';

/**
 * A button element but with the styles of a anchor element (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a).
 */
const StyledLinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  ${color}
  ${typography}

  :hover {
    color: ${props => props.hoverColor};
  }

  ${variant({
    prop: 'variant',
    variants: {
      danger: {
        color: 'red.500',
        '&:hover': {
          color: 'red.400',
        },
      },
    },
  })}
`;

StyledLinkButton.defaultProps = {
  color: '#3385FF',
  hoverColor: '#797d80',
};

StyledLinkButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
  hoverColor: PropTypes.string,
  variant: PropTypes.oneOf(['danger']),
};

export default StyledLinkButton;
