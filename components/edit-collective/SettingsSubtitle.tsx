import React from 'react';

import { P } from '../Text';

const SettingsSubtitle = ({ children }) => {
  return (
    <P fontSize="14px" lineHeight="21px" color="black.700" mt={2}>
      {children}
    </P>
  );
};

export default SettingsSubtitle;
