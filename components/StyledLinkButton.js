import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * A button element but with the styles of a anchor element (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a).
 */
const StyledLinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${props => props.color};
  cursor: pointer;

  :hover {
    color: ${props => props.hoverColor};
  }
`;

StyledLinkButton.defaultProps = {
  color: '#3385FF',
  hoverColor: '#797d80',
};

StyledLinkButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
  hoverColor: PropTypes.string,
};

export default StyledLinkButton;
