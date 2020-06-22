import React from 'react';

import CustomStyledIcon from './CustomStyledIcon';

const RoundHorizontalDotsIcon = props => {
  return (
    <CustomStyledIcon width={16} height={16} viewBox="0 0 16 16" fill="none" strokeWidth="0.25" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 8C0 6.89333 0.893333 6 2 6C3.10667 6 4 6.89333 4 8C4 9.10667 3.10667 10 2 10C0.893333 10 0 9.10667 0 8ZM8 6C6.89333 6 6 6.89333 6 8C6 9.10667 6.89333 10 8 10C9.10667 10 10 9.10667 10 8C10 6.89333 9.10667 6 8 6ZM14 6C12.8933 6 12 6.89333 12 8C12 9.10667 12.8933 10 14 10C15.1067 10 16 9.10667 16 8C16 6.89333 15.1067 6 14 6Z"
        fill="#969BA3"
      />
    </CustomStyledIcon>
  );
};

export default RoundHorizontalDotsIcon;
