import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

/**
 * Styled Drag Panel -
 * Display card list sorted by handle
 * @param {*} param0
 */
const StyledDropPanel = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

StyledDropPanel.propTypes = {
  children: PropTypes.any,
};

export default StyledDropPanel;
