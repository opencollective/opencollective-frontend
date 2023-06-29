import React, { createContext, useContext, useState } from 'react';
import MUIDrawer from '@mui/material/Drawer';
import { XMark } from '@styled-icons/heroicons-outline/XMark';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import { LifeBuoy, Home, Search, X } from 'lucide-react';
import { useTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import Image from './Image';
import { FormattedMessage } from 'react-intl';
import { ExternalLink, LogOut, Plus } from 'lucide-react';

import Container from './Container';
import { Box, Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';
import Link from './Link';
import SiteMenuMemberships from './SiteMenuMemberships';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';

const StyledDrawerContainer = styled.div<{ maxWidth: string }>`
  display: flex;
  height: 100vh;
  max-width: ${props => props.maxWidth};
  width: 100vw;
  flex-direction: column;
`;

const StyledMUIDrawer = styled(MUIDrawer)`
  height: 100vh !important;

  .MuiDrawer-paper {
    border-radius: 0 12px 12px 0;
  }
`;

const SummaryHeader = styled.span`
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
  top: 14px;
  right: 14px;
  color: #4b5563;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-top: 1px solid #e5e7eb;

  h3 {
    font-size: 12px;
    font-weight: 600;
    color: #656d76;
    letter-spacing: 0;
    line-height: 20px;
    margin: 0;

    padding: 0 8px;
  }
`;

const MenuLink = styled(Link)`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  &:hover {
    background: #f7f8fa;
    color: #1f2328;
  }
  padding: 8px;
  border-radius: 8px;
  color: #1f2328;
  svg {
    color: #4b5563;
  }
`;

const Footer = styled.div`
  padding: 0 24px;
  a {
    color: rgb(9, 105, 218);
    font-size: 12px;
    font-weight: 300;
    letter-spacing: 0;
    line-height: 18px;
  }
`;

const MenuItem = ({ children, href }) => {
  return <MenuLink href={href}>{children}</MenuLink>;
};

export default function Menu({
  open,
  onClose,
  'data-cy': dataCy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showActionsContainer?: boolean;
  'data-cy'?: string;
}) {
  const { LoggedInUser } = useLoggedInUser();
  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);
  return (
    <StyledMUIDrawer anchor="left" open={open} onClose={onClose} disableEnforceFocus={disableEnforceFocus}>
      <StyledDrawerContainer maxWidth="280px" data-cy={dataCy}>
        <Container position="relative" pt={'16px'} pb={'8px'}>
          <CloseDrawerButton type="button" isBorderless onClick={onClose}>
            <X size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
          </CloseDrawerButton>
          <Box px={3}>
            <Image ml={2} width="36" height="36" src="/static/images/opencollective-icon.png" alt="Open Collective" />
          </Box>
        </Container>
        <Flex flex={1} flexDirection="column" overflowY="scroll">
          <Flex flexDirection="column" pt={2} pb={3} px={3}>
            <MenuItem href="/dashboard">
              <Home size={16} /> Home
            </MenuItem>
            <MenuItem href="/search">
              <Search size={16} /> Explore
            </MenuItem>
            <MenuItem href="/help">
              <LifeBuoy size={16} /> Help & Support
            </MenuItem>
            {/* <hr />
            <MenuItem href="/home" openInNewTab>
              <FormattedMessage defaultMessage="Open Collective Homepage" /> <ExternalLink size={14} />
            </MenuItem>
            <MenuItem href="/help" openInNewTab>
              <FormattedMessage defaultMessage="Help & Support" /> <ExternalLink size={14} />
            </MenuItem>
            <MenuItem href="https://docs.opencollective.com" openInNewTab>
              <FormattedMessage defaultMessage="Documentation" /> <ExternalLink size={14} />
            </MenuItem> */}
          </Flex>
          {/* {LoggedInUser && <SiteMenuMemberships user={LoggedInUser} />} */}
        </Flex>
        <Container position="relative" py={'24px'} borderTop={'1px solid #e5e7eb'}>
          <Footer>
            <span style={{ fontSize: '12px', margin: '0 0 4px 0', display: 'block' }}>Open Collective</span>
            <Flex alignItems="center" justifyContent={'space-between'} width={'100%'}>
              <Link href="/home">Homepage</Link>{' '}
              <Link href="https://docs.opencollective.com/help/about/introduction">About</Link>{' '}
              <Link href="/privacypolicy">Privacy</Link> <Link href="/tos">Terms</Link>{' '}
              <Link href="https://blog.opencollective.com/">Blog</Link>
            </Flex>
          </Footer>
        </Container>
      </StyledDrawerContainer>
    </StyledMUIDrawer>
  );
}
