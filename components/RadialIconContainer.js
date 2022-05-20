import PropTypes from 'prop-types';
import styled from 'styled-components';
import { color, layout } from 'styled-system';

const RadialIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;

  ${layout}
  ${color}
`;

RadialIconContainer.propTypes = {
  color: PropTypes.string,
  bg: PropTypes.string,
  size: PropTypes.string,
};

RadialIconContainer.defaultProps = {
  color: '#ffffff',
};

export default RadialIconContainer;
