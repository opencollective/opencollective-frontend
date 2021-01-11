import React from 'react';
import PropTypes from 'prop-types';

import StyledHr from '../StyledHr';
import { H2, P } from '../Text';

const SettingsTitle = ({ children, subtitle, mb }) => {
  return (
    <React.Fragment>
      <H2 fontSize="20px" lineHeight="28px" mt={3}>
        {children}
      </H2>
      {subtitle && (
        <P fontSize="14px" lineHeight="21px" color="black.700" mt={2}>
          {subtitle}
        </P>
      )}
      <StyledHr mt={3} mb={mb} borderColor="black.400" />
    </React.Fragment>
  );
};

SettingsTitle.propTypes = {
  children: PropTypes.node,
  subtitle: PropTypes.node,
  mb: PropTypes.any,
};

SettingsTitle.defaultProps = {
  mb: 3,
};

export default SettingsTitle;
