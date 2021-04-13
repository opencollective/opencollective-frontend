import React from 'react';
import PropTypes from 'prop-types';

import CustomStyledIcon from './CustomStyledIcon';

const CreditCard = ({ size, ...props }) => {
  return (
    <CustomStyledIcon width={size || 26} height={size || 18} viewBox="0 0 26 18" fill="none" {...props}>
      <g id="Credit Card">
        <rect id="Rectangle" width="26" height="18" rx="3" fill="#0061E0" />
        <rect id="Rectangle_2" x="18" y="12" width="4" height="2" rx="1" fill="#5CA8FF" />
        <rect id="Rectangle_3" x="13" y="12" width="4" height="2" rx="1" fill="#5CA8FF" />
        <rect id="Rectangle_4" x="8" y="12" width="4" height="2" rx="1" fill="#5CA8FF" />
        <rect id="Rectangle_5" x="3" y="12" width="4" height="2" rx="1" fill="#5CA8FF" />
        <rect id="Rectangle_6" x="3" y="3" width="8" height="6" rx="2" fill="white" />
      </g>
    </CustomStyledIcon>
  );
};

CreditCard.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CreditCard;
