import React from 'react';
import CustomStyledIcon from './CustomStyledIcon';

/**
 * Set color to `#00cdff` to use the default Transferwise color.
 */
const TransferwiseIcon = props => {
  return (
    <CustomStyledIcon size="64" viewBox="-0.753 -0.753 9.424 9.407" {...props}>
      <path
        d="M.7-.76l1.475 2.47L-.42 4.176h4.47l.42-.988H2.004l1.493-1.484L2.625.227h4.068L3.12 8.662h1.224L8.338-.76H.7"
        fill="currentColor"
        strokeWidth="0.25"
      />
    </CustomStyledIcon>
  );
};

export default TransferwiseIcon;
