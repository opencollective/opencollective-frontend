import React from 'react';

import CustomStyledIcon from './CustomStyledIcon';

const CreditCardInactive = props => {
  return (
    <CustomStyledIcon width={26} height={18} viewBox="0 0 26 18" fill="none" {...props}>
      <rect width="26" height="18" rx="3" fill="#D5DAE0" />
      <rect x="18" y="12" width="4" height="2" rx="1" fill="#A5ADB8" />
      <rect x="13" y="12" width="4" height="2" rx="1" fill="#A5ADB8" />
      <rect x="8" y="12" width="4" height="2" rx="1" fill="#A5ADB8" />
      <rect x="3" y="12" width="4" height="2" rx="1" fill="#A5ADB8" />
      <rect x="3" y="3" width="8" height="6" rx="2" fill="white" />
    </CustomStyledIcon>
  );
};

export default CreditCardInactive;
