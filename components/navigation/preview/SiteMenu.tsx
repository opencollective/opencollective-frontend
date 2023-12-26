import React, { useState } from 'react';
import { BookOpen, Home, LayoutDashboard, LifeBuoy, Menu, Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';

import { Flex } from '../../Grid';
import Image from '../../Image';
import Link from '../../Link';
import { DrawerCloseButton, DrawerMenu, DrawerMenuItem } from '../DrawerMenu';

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
            <Flex alignItems="center" gridGap={2}>
              <Link href={LoggedInUser ? '/dashboard' : '/'} onClick={onClose}>
                <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />
              </Link>
              <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
            </Flex>
            <DrawerCloseButton onClick={onClose} />
          </Flex>

          <Flex flex={1} flexDirection="column" overflowY="auto">
            <Flex flexDirection="column" py={2}>
              {LoggedInUser ? (
                <DrawerMenuItem href={'/dashboard'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <LayoutDashboard size={16} /> <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                  </Flex>
                </DrawerMenuItem>
              ) : (
                <DrawerMenuItem href={'/'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <Home size={16} /> <FormattedMessage id="home" defaultMessage="Home" />
                  </Flex>
                </DrawerMenuItem>
              )}

              <DrawerMenuItem href="/search" onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <Search size={16} /> <FormattedMessage id="Explore" defaultMessage="Explore" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="/help" onClick={onClose}>
                <Flex alignItems="center" gridGap={2}>
                  <LifeBuoy size={16} /> <FormattedMessage defaultMessage="Help & Support" />
                </Flex>
              </DrawerMenuItem>
              <DrawerMenuItem href="https://docs.opencollective.com" onClick={onClose} openInNewTab>
                <Flex alignItems="center" gridGap={2}>
                  <BookOpen size={16} /> <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
                </Flex>
              </DrawerMenuItem>
              {LoggedInUser && (
                <DrawerMenuItem href={'/home'} onClick={onClose}>
                  <Flex alignItems="center" gridGap={2}>
                    <Home size={16} /> <FormattedMessage defaultMessage="Open Collective Home" />
                  </Flex>
                </DrawerMenuItem>
              )}
            </Flex>
          </Flex>
        </React.Fragment>
      </DrawerMenu>
    </React.Fragment>
  );
}
