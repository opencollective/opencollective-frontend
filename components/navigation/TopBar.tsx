import React, { Fragment, useRef, useState } from 'react';
import { get, max, min } from 'lodash';
import { ArrowRight, Compass, Frame, Globe, Globe2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import useLocalStorage from '../../lib/hooks/useLocalStorage';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { ScrollDirection, useWindowScroll } from '../../lib/hooks/useWindowScroll';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import AccountSwitcher from '../dashboard/NewAccountSwitcher';
import DividerIcon from '../DividerIcon';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import SearchModal from '../Search';
import SearchTrigger from '../SearchTrigger';

import { cn } from '../../lib/utils';

import ProfileMenu from './ProfileMenu';
import SiteMenu from './SiteMenu';
import { getCollectivePageRoute } from '../../lib/url-helpers';

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

const TopBar = ({ account, navTitle = '' }: TopBarProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const ref = useRef();
  const router = useRouter();
  const [lastWorkspaceVisit] = useLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE, {
    slug: LoggedInUser?.collective.slug,
  });

  const activeSlug = router.query.slug || lastWorkspaceVisit.slug || LoggedInUser?.collective.slug;

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
  const hasBreadCrumbNav = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.BREADCRUMB_NAV);

  return (
    <Fragment>
      <div className="border-b bg-white px-4 md:px-6" ref={ref}>
        <div className="flex h-16 items-center justify-between gap-2 py-4">
          <div className="flex items-center gap-3">
            {hasBreadCrumbNav && <SiteMenu />}
            <Box flexShrink={0}>
              <Link href={ocLogoRoute}>
                <Flex alignItems="center" gridGap={2}>
                  <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />
                </Flex>
              </Link>
            </Box>
          </div>

          {hasBreadCrumbNav ? (
            <div className="flex flex-1 items-center gap-2">
              {onDashboardRoute ? (
                <React.Fragment>
                  <MainNavItem href="/dashboard">
                    <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                  </MainNavItem>
                  <DividerIcon size={32} className="-ml-4 -mr-3 text-slate-300" />
                  <AccountSwitcher activeSlug={activeSlug} />
                  <Link
                    href={getCollectivePageRoute(account)}
                    className={cn(
                      'group flex items-center justify-center rounded-full border px-0 text-sm font-medium leading-6 antialiased transition-colors hover:border-border lg:border-transparent lg:px-2.5',
                      'text-foreground hover:bg-slate-50 hover:text-foreground',
                      'h-8 w-8 lg:w-auto',
                    )}
                  >
                    <Globe2 className="block text-muted-foreground group-hover:text-foreground lg:hidden" size={16} />
                    <span className="hidden items-center gap-x-1.5 lg:flex">
                      Public profile
                      <ArrowRight size={16} className="group-hover:animate-arrow-right" />
                    </span>
                  </Link>
                </React.Fragment>
              ) : account ? (
                <React.Fragment>
                  {account.parentCollective && (
                    <React.Fragment>
                      <DividerIcon size={32} className="-mx-3 text-slate-300" />

                      <MainNavItem href={getCollectivePageRoute(account.parentCollective)} className="!font-normal">
                        {account.parentCollective.name}
                      </MainNavItem>
                    </React.Fragment>
                  )}
                  <DividerIcon size={32} className="-mx-2 text-slate-300" />

                  <MainNavItem href={getCollectivePageRoute(account)}>{account.name}</MainNavItem>
                </React.Fragment>
              ) : (
                <MainNavItem href={'#'}>{navTitle}</MainNavItem>
              )}
            </div>
          ) : (
            <Flex flex={1} alignItems="center" gridGap={3} overflow={'hidden'}>
              <MainNavItem href="/dashboard" isActive={onDashboardRoute}>
                <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
              </MainNavItem>
              <MainNavItem href="/search" isActive={onSearchRoute}>
                <FormattedMessage id="Explore" defaultMessage="Explore" />
              </MainNavItem>
            </Flex>
          )}

          <Flex alignItems="center" gridGap={2} flexShrink={4} flexGrow={0}>
            <SearchTrigger setShowSearchModal={setShowSearchModal} />

            <div className="hidden sm:block">
              <ChangelogTrigger />
            </div>
            <ProfileMenu />
          </Flex>
        </div>
      </div>
      <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
      {isMobile && (onDashboardRoute || onSearchRoute) && <MobileFooterMenu {...{ onDashboardRoute, onSearchRoute }} />}
    </Fragment>
  );
};

export default TopBar;
