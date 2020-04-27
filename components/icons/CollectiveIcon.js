import React from 'react';
import PropTypes from 'prop-types';

import CustomStyledIcon from './CustomStyledIcon';

const CollectiveIcon = props => (
  <CustomStyledIcon
    viewBox="0 0 24 24"
    fill="none"
    strokeWith="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z" />
    <path
      opacity="0.75"
      d="M8 18C9.10457 18 10 17.1046 10 16C10 14.8954 9.10457 14 8 14C6.89543 14 6 14.8954 6 16C6 17.1046 6.89543 18 8 18Z"
    />
    <path
      opacity="0.75"
      d="M16 18C17.1046 18 18 17.1046 18 16C18 14.8954 17.1046 14 16 14C14.8954 14 14 14.8954 14 16C14 17.1046 14.8954 18 16 18Z"
    />
    <path
      opacity="0.75"
      d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
    />
    <path
      opacity="0.75"
      d="M16 10C17.1046 10 18 9.10457 18 8C18 6.89543 17.1046 6 16 6C14.8954 6 14 6.89543 14 8C14 9.10457 14.8954 10 16 10Z"
    />
  </CustomStyledIcon>
);

CollectiveIcon.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CollectiveIcon;
