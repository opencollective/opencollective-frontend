import React, { Fragment, useRef, useState } from 'react';
import { max, min } from 'lodash';
import { Compass, Frame } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { ScrollDirection, useWindowScroll } from '../../lib/hooks/useWindowScroll';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import SearchModal from '../Search';
import SearchTrigger from '../SearchTrigger';

import ProfileMenu from './ProfileMenu';

const MobileFooterBar = styled(Flex)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 76px;
  border-top: 1px solid ${props => props.theme.colors.black[300]};
  background: #fff;
  z-index: 1199;
  padding: 8px 16px;
`;

const MobileFooterLink = styled(Link)<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.black[700]};

  ${props =>
    props.isActive &&
    css`
      svg {
        color: ${props => props.theme.colors.primary[500]};
      }
      ${MobileFooterIconContainer} {
        background-color: ${props => props.theme.colors.primary[50]};
      }
    `}
`;

const MobileFooterIconContainer = styled(Box)`
  width: 36px;
  height: 36px;
  padding: 8px;
  border-radius: 24px;
`;

const MainNavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 340px;
  flex-shrink: 1;
  color: #0f172a;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
  border-radius: 100px;
  white-space: nowrap;
  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  text-overflow: ellipsis;
  overflow: hidden;

  ${props =>
    props.href &&
    css`
      @media (hover: hover) {
        :hover {
          color: #0f172a !important;
          background-color: #f1f5f9;
        }
      }
    `}
  ${props =>
    props.href &&
    css`
      &:hover {
        color: #0f172a !important;
        background-color: #f1f5f9;
      }
    }
  `}
  ${props => props.primary && `border: 1px solid #d1d5db;`}
  font-weight: ${props => (props.lightWeight ? `400` : '500')};
  ${props => props.isActive && `background-color: #f1f5f9;`}

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MobileFooterMenu = ({ onDashboardRoute, onSearchRoute }) => {
  const { direction, accPosition } = useWindowScroll();
  const bottom = direction === ScrollDirection.DOWN ? -min([accPosition, 76]) : -max([76 - accPosition, 0]);

  return (
    <MobileFooterBar alignItems="center" justifyContent="center" gap="12px" style={{ bottom: `${bottom}px` }}>
      <MobileFooterLink href="/dashboard" isActive={onDashboardRoute}>
        <MobileFooterIconContainer className="icon-container">
          <Frame size={20} />
        </MobileFooterIconContainer>
        <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
      </MobileFooterLink>

      <MobileFooterLink href="/search" isActive={onSearchRoute}>
        <MobileFooterIconContainer className="icon-container">
          <Compass size={20} />
        </MobileFooterIconContainer>
        <FormattedMessage id="Explore" defaultMessage="Explore" />
      </MobileFooterLink>
    </MobileFooterBar>
  );
};

type TopBarProps = {
  showSearch?: boolean;
  showProfileAndChangelogMenu?: boolean;
  menuItems?: {
    solutions?: boolean;
    product?: boolean;
    company?: boolean;
    docs?: boolean;
  };
  account?: {
    parentCollective?: {
      name: string;
      slug: string;
    };
    name: string;
    slug: string;
  };
  navTitle?: string;
  loading?: boolean;
};

const TopBar = ({ account }: TopBarProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const ref = useRef();
  const router = useRouter();
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');
  const onSearchRoute =
    isRouteActive('/search') || (account && isRouteActive(`/${account.parentCollective?.slug || account.slug}`));
  const ocLogoRoute = LoggedInUser ? '/dashboard' : '/home';

  return (
    <Fragment>
      <div className="border-b bg-white px-4 md:px-7" ref={ref}>
        <div className="flex h-16 items-center justify-between gap-4 py-4">
          <Flex alignItems="center" gridGap={[2, 3]}>
            <Box flexShrink={0}>
              <Link href={ocLogoRoute}>
                <Flex alignItems="center" gridGap={2}>
                  <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />
                </Flex>
              </Link>
            </Box>
          </Flex>

          <Flex flex={1} alignItems="center" gridGap={3} overflow={'hidden'}>
            <MainNavItem href="/dashboard" isActive={onDashboardRoute}>
              <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
            </MainNavItem>
            <MainNavItem href="/search" isActive={onSearchRoute}>
              <FormattedMessage id="Explore" defaultMessage="Explore" />
            </MainNavItem>
          </Flex>

          <Flex alignItems="center" gridGap={2} flexShrink={4} flexGrow={0}>
            <SearchTrigger setShowSearchModal={setShowSearchModal} />
            <div className="hidden sm:block">
              <ChangelogTrigger />
            </div>
            <ProfileMenu
              logoutParameters={{ skipQueryRefetch: onDashboardRoute, redirect: onDashboardRoute ? '/' : undefined }}
            />
          </Flex>
        </div>
      </div>
      <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
      {isMobile && (onDashboardRoute || onSearchRoute) && <MobileFooterMenu {...{ onDashboardRoute, onSearchRoute }} />}
    </Fragment>
  );
};

export default TopBar;
