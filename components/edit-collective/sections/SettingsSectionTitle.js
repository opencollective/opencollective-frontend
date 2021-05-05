import React from 'react';
import PropTypes from 'prop-types';

import { Flex } from '../../Grid';
import StyledHr from '../../StyledHr';
import { H3 } from '../../Text';

const SettingsSectionTitle = ({ children, ...props }) => {
  return (
    <Flex alignItems="center" mb={3} width="100%" {...props}>
      <H3 fontSize="14px" lineHeight="21px">
        {children}
      </H3>
      <StyledHr ml={2} flex="1 1" borderColor="black.400" />
    </Flex>
  );
};

SettingsSectionTitle.propTypes = {
  children: PropTypes.node,
};

export default SettingsSectionTitle;
