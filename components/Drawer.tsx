import React, { createContext, useContext, useState } from 'react';
import MUIDrawer from '@mui/material/Drawer';
import { XMark } from '@styled-icons/heroicons-outline/XMark';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import { useTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';

const StyledDrawerContainer = styled.div<{ maxWidth: string }>`
  display: flex;
  height: 100%;
  max-width: ${props => props.maxWidth};
  width: 100vw;
  flex-direction: column;
`;

const StyledDrawerActionsContainer = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.200')};
`;

export const SummaryHeader = styled.span`
  > a {
    color: inherit;
    text-decoration: underline;
    outline: none;
    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const CloseDrawerButton = styled(StyledRoundButton)`
  position: absolute;
  top: 16px;
  right: 16px;
`;

export const DrawerActionsContext = createContext(null);

export const useDrawerActionsContainer = () => useContext(DrawerActionsContext);

export default function Drawer({
  open,
  onClose,
  children,
  maxWidth = '768px',
  showActionsContainer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showActionsContainer?: boolean;
}) {
  const [drawerActionsContainer, setDrawerActionsContainer] = useState(null);
  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);
  return (
    <DrawerActionsContext.Provider value={drawerActionsContainer}>
      <MUIDrawer anchor="right" open={open} onClose={onClose} disableEnforceFocus={disableEnforceFocus}>
        <StyledDrawerContainer maxWidth={maxWidth}>
          <Flex flex={1} flexDirection="column" overflowY="scroll">
            <Container position="relative" py={'24px'}>
              <CloseDrawerButton type="button" isBorderless onClick={onClose}>
                <XMark size="24" aria-hidden="true" />
              </CloseDrawerButton>

              <Box px={[3, '24px']}>{children}</Box>
            </Container>
          </Flex>
          {showActionsContainer && (
            <StyledDrawerActionsContainer
              flexWrap="wrap"
              gridGap={2}
              flexShrink="0"
              justifyContent="space-between"
              p={3}
              ref={ref => setDrawerActionsContainer(ref)}
            />
          )}
        </StyledDrawerContainer>
      </MUIDrawer>
    </DrawerActionsContext.Provider>
  );
}
