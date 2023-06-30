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
  padding: 0 24px;
  a {
    color: rgb(9, 105, 218);
    font-size: 12px;
    font-weight: 300;
    letter-spacing: 0;
    line-height: 18px;
  }
`;

export default function SiteMenu({ ocLogoRoute }: { ocLogoRoute: string }) {
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
              <Link href={LoggedInUser ? '/dashboard' : '/home'} onClick={onClose}>
                <Image width="32" height="32" src="/static/images/opencollective-icon.png" alt="Open Collective" />
              </Link>
              <Flex height="32px" alignItems="center">
                <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
              </Flex>
            </Flex>
            <DrawerCloseButton onClick={onClose} />
          </Flex>

          <Flex flex={1} flexDirection="column" overflowY="scroll">
            <Flex flexDirection="column" py={2}>
              <DrawerMenuItem href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} /> <FormattedMessage defaultMessage="Home" />
                </Flex>
              </DrawerMenuItem>
              {/* <DrawerMenuItem href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <LampDesk size={16} />{' '}
                  {LoggedInUser ? (
                    <FormattedMessage defaultMessage="Workspace" />
                  ) : (
                    <FormattedMessage defaultMessage="Home" />
                  )}
                </Flex>
              </DrawerMenuItem> */}

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

            <hr />
            <Flex flexDirection="column" py={2}>
              {/* 
              <DrawerMenuItem href="https://slack.opencollective.com/" onClick={onClose} openInNewTab>
                <Flex alignItems="center" gridGap={2}>
                  <Slack size={16} /> <FormattedMessage defaultMessage="Join our Slack" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="https://github.com/opencollective/opencollective" openInNewTab onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Github size={16} /> <FormattedMessage defaultMessage="Open Source" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="https://blog.opencollective.com/" onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Newspaper size={16} />
                  <span>
                    <FormattedMessage defaultMessage="Blog" />
                  </span>
                </Flex>
              </DrawerMenuItem>
              <hr /> */}
              {/* <DrawerMenuItem href={LoggedInUser ? '/home' : '/'} onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Home size={16} /> <FormattedMessage defaultMessage="Home" />
                </Flex>
              </DrawerMenuItem> */}
              {/* <DrawerMenuItem href="#">
                <Flex alignItems="center" gridGap={2}>
                  <Lightbulb size={16} />
                  <span>
                    <FormattedMessage defaultMessage="Open Collective Homepage" />
                  </span>
                </Flex>
                <ChevronDown size={16} />
              </DrawerMenuItem> */}
              <DrawerMenuItem href="#">
                <Flex alignItems="center" gridGap={2}>
                  <Lightbulb size={16} />
                  <span>
                    <FormattedMessage defaultMessage="Solutions" />
                  </span>
                </Flex>
                <ChevronDown size={16} />
              </DrawerMenuItem>
              <DrawerMenuItem href="#">
                <Flex alignItems="center" gridGap={2}>
                  <Box size={16} />

                  <span>
                    <FormattedMessage defaultMessage="Product" />
                  </span>
                </Flex>
                <ChevronDown size={16} />
              </DrawerMenuItem>
              <DrawerMenuItem href="#">
                <Flex alignItems="center" gridGap={2}>
                  <Building2 size={16} />

                  <span>
                    <FormattedMessage defaultMessage="Company" />
                  </span>
                </Flex>
                <ChevronDown size={16} />
              </DrawerMenuItem>
              <DrawerMenuItem href="#">
                <Flex alignItems="center" gridGap={2}>
                  <MessagesSquare size={16} />

                  <span>
                    <FormattedMessage defaultMessage="Community" />
                  </span>
                </Flex>
                <ChevronDown size={16} />
              </DrawerMenuItem>
            </Flex>
            {/* <DrawerMenuItem href="/help" onClick={onClose}>
              <Flex alignItems="center" gridGap={2}>
                <Github size={16} /> <FormattedMessage defaultMessage="Open Collective Homepage" />
              </Flex>
              <ExternalLink size={16} className="show-on-hover" />
            </DrawerMenuItem> */}
          </Flex>
          <Container position="relative" py={'24px'} borderTop={'1px solid #e5e7eb'}>
            <Footer>
              <span
                style={{ fontSize: '12px', margin: '0 0 8px 0', display: 'block', color: '#6e7781', fontWeight: 300 }}
              >
                Open Collective
              </span>
              <Flex alignItems="center" justifyContent={'space-between'} width={'100%'}>
                <Link href="/home">Homepage</Link> <Link href="/contact">Contact</Link>{' '}
                <Link href="/privacypolicy">Privacy</Link> <Link href="/tos">Terms</Link>{' '}
              </Flex>
            </Footer>
          </Container>
        </React.Fragment>
      </DrawerMenu>
    </React.Fragment>
  );
}
