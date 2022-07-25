import PropTypes from 'prop-types';
import styled from 'styled-components';
import { border, color, flex, layout } from 'styled-system';

const RadialIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;

  ${layout}
  ${flex}
  ${color}
  ${border}
`;

RadialIconContainer.propTypes = {
  color: PropTypes.string,
  bg: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

RadialIconContainer.defaultProps = {
  color: '#ffffff',
};

export default RadialIconContainer;
