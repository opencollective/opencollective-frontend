import React from 'react';
import PropTypes from 'prop-types';

import { P } from '../Text';

const SettingsSubtitle = ({ children }) => {
  return (
    <P fontSize="14px" lineHeight="21px" color="black.700" mt={2}>
      {children}
    </P>
  );
};

SettingsSubtitle.propTypes = {
  children: PropTypes.node,
};

export default SettingsSubtitle;
