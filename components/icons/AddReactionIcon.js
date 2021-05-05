import React from 'react';
import PropTypes from 'prop-types';

import CustomStyledIcon from './CustomStyledIcon';

const AddReactionIcon = props => (
  <CustomStyledIcon fill="none" width="17" height="16" viewBox="0 0 17 16" {...props}>
    <path
      fill="#9D9FA3"
      fillRule="evenodd"
      d="M13.136 3.81v2.285h1.546V3.81H17V2.286h-2.318V0h-1.546v2.286h-2.318V3.81h2.318zM0 8.762c0-3.996 3.281-7.238 7.334-7.238.94 0 1.84.174 2.666.491v1.668a5.84 5.84 0 00-2.66-.635c-3.201 0-5.795 2.557-5.795 5.714 0 3.157 2.594 5.714 5.796 5.714 3.202 0 5.795-2.557 5.795-5.714A5.64 5.64 0 0012.856 7h1.607c.143.564.219 1.154.219 1.762 0 3.995-3.289 7.238-7.348 7.238C3.28 16 0 12.757 0 8.762zm9.66-.381c.64 0 1.158-.51 1.158-1.143A1.15 1.15 0 009.66 6.095c-.641 0-1.159.51-1.159 1.143a1.15 1.15 0 001.16 1.143zM6.181 7.238a1.15 1.15 0 01-1.16 1.143 1.15 1.15 0 01-1.158-1.143 1.15 1.15 0 011.159-1.143c.641 0 1.159.51 1.159 1.143zm1.159 5.714c1.585 0 2.933-.953 3.477-2.285H3.864c.544 1.332 1.891 2.285 3.477 2.285z"
      clipRule="evenodd"
      strokeWidth="0.1"
    ></path>
  </CustomStyledIcon>
);

AddReactionIcon.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default AddReactionIcon;
