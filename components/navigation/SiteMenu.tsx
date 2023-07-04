import React, { createContext, useContext, useState } from 'react';
import MUIDrawer from '@mui/material/Drawer';
import { XMark } from '@styled-icons/heroicons-outline/XMark';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import {
  LifeBuoy,
  Home,
  Search,
  Menu,
  Book,
  Slack,
  Github,
  Pen,
  Globe,
  MessageCircle,
  MessageSquare,
  Newspaper,
  ChevronRight,
  BookOpen,
  ChevronLeft,
  ChevronDown,
  Lightbulb,
  AppWindow,
  MessagesSquare,
  Building2,
  Box,
  LampDesk,
} from 'lucide-react';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import Image from '../Image';
import { FormattedMessage } from 'react-intl';
import { ExternalLink, LogOut, Plus } from 'lucide-react';

import Container from '../Container';
import { Flex } from '../Grid';
import Link from '../Link';

import { DrawerMenu, DrawerCloseButton, DrawerMenuItem } from './DrawerMenu';
import StyledButton from '../StyledButton';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

const StyledMenuButton = styled(StyledButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 8px;
  color: #334155;
  font-weight: 500;
  font-size: 14px;
  height: 32px;
  width: 32px;
  padding: 0;
  // border-radius: 8px;
  border-radius: 100px;

  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  white-space: nowrap;
  border: 1px solid #d1d5db;
  // border: 1px solid transparent;

  @media (hover: hover) {
    :hover {
      color: #0f172a;
      background-color: #f1f5f9;
    }
  }
`;

const Footer = styled.div`
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0;
  line-height: 18px;
  padding: 20px;

  span {
    color: #6e7781;
    display: block;
    margin-bottom: 8px;
  }
`;

export default function SiteMenu() {
  const { LoggedInUser } = useLoggedInUser();
  const [showMenu, setShowMenu] = useState(false);
  const onClose = () => setShowMenu(false);

  return (
    <React.Fragment>
      <StyledMenuButton onClick={() => setShowMenu(true)}>
        <Menu size={20} absoluteStrokeWidth strokeWidth={1.5} />
      </StyledMenuButton>

      <DrawerMenu anchor="left" open={showMenu} onClose={onClose}>
        <React.Fragment>
          <Flex p={3} justifyContent="space-between" gridGap={3}>
            <Flex alignItems="start" gridGap={2}>
              <Link href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Image width="32" height="32" src="/static/images/opencollective-icon.png" alt="Open Collective" />
              </Link>
              <Flex height="32px" alignItems="center">
                <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
              </Flex>
            </Flex>
            <DrawerCloseButton onClick={onClose} />
          </Flex>

          <Flex flex={1} flexDirection="column" overflowY="auto">
            <Flex flexDirection="column" py={2}>
              <DrawerMenuItem href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} /> <FormattedMessage id="home" defaultMessage="Home" />
                </Flex>
              </DrawerMenuItem>

              <DrawerMenuItem href="/search" onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Search size={16} /> <FormattedMessage defaultMessage="Explore" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="/help" onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <LifeBuoy size={16} /> <FormattedMessage defaultMessage="Help & Support" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="https://docs.opencollective.com" onClick={onClose} openInNewTab>
                <Flex alignItems="center" gridGap={2}>
                  <BookOpen size={16} /> <FormattedMessage defaultMessage="Docs" />
                </Flex>
              </DrawerMenuItem>
            </Flex>
          </Flex>
          <Container position="relative" borderTop={'1px solid #f3f4f6'}>
            <Footer>
              <span>Open Collective</span>
              <Flex alignItems="center" justifyContent={'space-between'} width={'100%'}>
                <Link href="/home" onClick={onClose}>
                  <FormattedMessage id="Homepage" defaultMessage="Homepage" />
                </Link>
                <Link href="/contact" onClick={onClose}>
                  <FormattedMessage id="Contact" defaultMessage="Contact" />
                </Link>
                <Link href="/privacypolicy" onClick={onClose}>
                  <FormattedMessage defaultMessage="Privacy" />
                </Link>
                <Link href="/tos" onClick={onClose}>
                  <FormattedMessage defaultMessage="Terms" />
                </Link>
              </Flex>
            </Footer>
          </Container>
        </React.Fragment>
      </DrawerMenu>
    </React.Fragment>
  );
}
