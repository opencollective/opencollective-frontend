import React from 'react';
import PropTypes from 'prop-types';
import { lighten } from 'polished';

import CustomStyledIcon from './CustomStyledIcon';

/* eslint-disable react/no-unknown-property */
const GiftCard = props => {
  const gradientID = `gradient-${props.color.replace('#', '')}`;
  return (
    <CustomStyledIcon width={props.size || 26} height={props.size || 18} viewBox="0 0 26 18" fill="none" {...props}>
      <rect width="26" height="18" rx="3" fill="#0061E0" />
      <rect x="0.5" y="0.5" width="25" height="17" rx="1.5" fill="white" stroke="#DCDEE0" />
      <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="26" height="18">
        <rect width="26" height="18" rx="2" fill="white" />
      </mask>
      <g mask="url(#mask1)">
        <path
          d="M8.07049e-08 1.996C4.1109e-08 0.891429 0.89543 0 2 0H24C25.1046 0 26 0.894228 26 1.9988C26 4.23868 26 7.86701 26 10.2455C10.855 8.46077 15.99 16.7119 0 15.2517C3.66594e-07 11.821 1.98615e-07 5.28523 8.07049e-08 1.996Z"
          fill={`url(#${gradientID})`}
        />
        <path
          opacity="0.4"
          d="M0 14.9949C12.2525 15.2461 9.91251 6.1225 26 9.93096C26 10.0147 26 10.0565 26 10.2239C10.855 8.38248 15.99 16.7527 0 15.2461C5.02799e-07 10.3913 0 15.2042 0 14.9949Z"
          fill="white"
          fillOpacity="0.48"
        />
        <path
          opacity="0.24"
          d="M0 10.2856C9.58751 10.2856 14.5925 14.7595 26 12.9198C26 12.418 26 15.094 26 15.4285C25.3175 15.4285 2.925 15.4285 0 15.4285C5.02799e-07 10.5783 0 10.4947 0 10.2856Z"
          fill="white"
          fillOpacity="0.48"
        />
      </g>
      <defs>
        <linearGradient id={gradientID} x1="0" y1="0" x2="13.5422" y2="22.8211" gradientUnits="userSpaceOnUse">
          <stop stopColor={props.color} />
          <stop offset="1" stopColor={lighten(0.24, props.color)} />
        </linearGradient>
      </defs>
    </CustomStyledIcon>
  );
};

GiftCard.defaultProps = {
  color: '#145ECC',
};

GiftCard.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default GiftCard;
