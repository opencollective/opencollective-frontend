import React from 'react';
import PropTypes from 'prop-types';

const SearchIcon = ({ size = 48, fill = '#FFFFFF', ...props }) => (
  <svg width={size} height={size} viewBox="10 10 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Search</title>
    <path
      d="M28.5404814,30.1903972 C26.7995948,31.5736628 24.5962981,32.4 22.2,32.4 C16.5666956,32.4 12,27.8333044 12,22.2 C12,16.5666956 16.5666956,12 22.2,12 C27.8333044,12 32.4,16.5666956 32.4,22.2 C32.4,24.5962981 31.5736628,26.7995948 30.1903972,28.5404814 L35.6582912,34.0083754 C36.1139029,34.4639871 36.1139029,35.2026796 35.6582912,35.6582912 C35.2026796,36.1139029 34.4639871,36.1139029 34.0083754,35.6582912 L28.5404814,30.1903972 Z M22.2,30 C26.507821,30 30,26.507821 30,22.2 C30,17.892179 26.507821,14.4 22.2,14.4 C17.892179,14.4 14.4,17.892179 14.4,22.2 C14.4,26.507821 17.892179,30 22.2,30 Z"
      fill={fill}
      fillRule="nonzero"
    />
  </svg>
);

SearchIcon.propTypes = {
  size: PropTypes.number,
  fill: PropTypes.string,
};

export default SearchIcon;
