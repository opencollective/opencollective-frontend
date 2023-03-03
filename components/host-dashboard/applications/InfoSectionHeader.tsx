import React from 'react';

import { Box, Flex } from '../../Grid';
import StyledHr from '../../StyledHr';
import { Span } from '../../Text';

type InfoSectionHeaderProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export const InfoSectionHeader = ({ children, icon = null }: InfoSectionHeaderProps) => (
  <Flex alignItems="center" mb={3}>
    {icon && <Box mr={2}>{icon}</Box>}
    <Span fontSize="11px" fontWeight="500" color="black.500" textTransform="uppercase" mr={2}>
      {children}
    </Span>
    <StyledHr borderColor="black.200" flex="1 1" />
  </Flex>
);
