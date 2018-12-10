import PropTypes from 'prop-types';
import { LoaderAlt } from 'styled-icons/boxicons-regular/LoaderAlt.cjs';
import styled from 'styled-components';

/** A loading spinner using SVG + css animation. */
const StyledSpinner = styled(LoaderAlt)`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  animation: spin 1s linear infinite;
`;

StyledSpinner.defaultProps = {
  title: 'Loading',
  size: '1em',
};

StyledSpinner.propTypes = {
  /** From styled-icons, this is a convenience for setting both width and height to the same value */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** A title for accessibility */
  title: PropTypes.string,
};

/** @component */
export default StyledSpinner;
