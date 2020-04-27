import React from 'react';

import CustomStyledIcon from './CustomStyledIcon';

const SpeechTriangle = props => {
  return (
    <CustomStyledIcon
      width="16"
      height="24"
      viewBox="0 0 16 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 24L16 -6.99382e-07L16 24L0 24Z" fill="white" />
    </CustomStyledIcon>
  );
};

export default SpeechTriangle;
