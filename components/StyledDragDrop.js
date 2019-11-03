import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

/**
 * Styled Drag and Drop Panel -
 * Display card list sorted by handle
 * @param {*} param0
 */
const StyledDragDrop = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

StyledDragDrop.propTypes = {
  children: PropTypes.any,
};

export default StyledDragDrop;
