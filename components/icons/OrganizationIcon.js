import React from 'react';
import PropTypes from 'prop-types';
import CustomStyledIcon from './CustomStyledIcon';

const OrganizationIcon = props => (
  <CustomStyledIcon
    viewBox="0 0 24 24"
    fill="none"
    strokeWith="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M23 12.5V5C23 3.93913 22.5786 2.92172 21.8284 2.17157C21.0783 1.42143 20.0609 1 19 1H5C3.93913 1 2.92172 1.42143 2.17157 2.17157C1.42143 2.92172 1 3.93913 1 5V12.5" />
    <path d="M1 12.5L1 19C1 20.0609 1.42143 21.0783 2.17157 21.8284C2.92172 22.5786 3.93913 23 5 23L19 23C20.0609 23 21.0783 22.5786 21.8284 21.8284C22.5786 21.0783 23 20.0609 23 19L23 12.5" />
    <rect opacity="0.75" x="5" y="14" width="5" height="5" />
    <rect opacity="0.75" x="14" y="14" width="5" height="5" />
    <rect opacity="0.75" x="5" y="5" width="5" height="5" />
    <rect opacity="0.75" x="14" y="5" width="5" height="5" />
  </CustomStyledIcon>
);

OrganizationIcon.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default OrganizationIcon;
