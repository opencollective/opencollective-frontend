import React, { useState } from 'react';
import { BookOpen, Home, LayoutDashboard, LifeBuoy, Menu, Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Container from '../Container';
import { Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import StyledButton from '../StyledButton';

import { DrawerCloseButton, DrawerMenu, DrawerMenuItem } from './DrawerMenu';

const StyledMenuButton = styled(StyledButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 8px;
  color: #334155;
  font-weight: 500;
  font-size: 14px;
  height: 36px;
  width: 36px;
  padding: 0;
  border-radius: 100px;

  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  white-space: nowrap;
  border: 1px solid transparent;

  @media (hover: hover) {
    :hover {
      color: #0f172a;
      background-color: #f1f5f9;
      border: 1px solid #e6e8eb;
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
      <button
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-slate-50"
        onClick={() => setShowMenu(true)}
      >
        <Menu size={18} absoluteStrokeWidth strokeWidth={1.5} />
      </button>

      <DrawerMenu anchor="left" open={showMenu} onClose={onClose}>
        <React.Fragment>
          <Flex p={3} justifyContent="space-between" gridGap={3}>
            <Flex alignItems="start" gridGap={2}>
              <Link href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />
              </Link>
              <Flex height="36px" alignItems="center">
                <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
              </Flex>
            </Flex>
            <DrawerCloseButton onClick={onClose} />
          </Flex>

          <Flex flex={1} flexDirection="column" overflowY="auto">
            <Flex flexDirection="column" py={2}>
              {LoggedInUser && (
                <DrawerMenuItem href={'/home'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <Home size={16} /> <FormattedMessage defaultMessage="Homepage" />
                  </Flex>
                </DrawerMenuItem>
              )}
              {LoggedInUser ? (
                <DrawerMenuItem href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <LayoutDashboard size={16} /> <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                  </Flex>
                </DrawerMenuItem>
              ) : (
                <DrawerMenuItem href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <Home size={16} /> <FormattedMessage id="home" defaultMessage="Home" />
                  </Flex>
                </DrawerMenuItem>
              )}

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
        </React.Fragment>
      </DrawerMenu>
    </React.Fragment>
  );
}
