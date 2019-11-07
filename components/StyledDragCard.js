import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

/**
 * Styled Drag Card -
 * Display card list sorted by handle
 * @param {*} param0
 */

export const StyledDragCard = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

StyledDragCard.propTypes = {
  children: PropTypes.any,
};

export default StyledDragCard;
