import React, { Fragment, useRef, useState } from 'react';
import clsx from 'clsx';
import { get, max, min } from 'lodash';
import { ArrowRight, Compass, Frame, Globe, Globe2, CircleIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import useLocalStorage from '../../lib/hooks/useLocalStorage';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { ScrollDirection, useWindowScroll } from '../../lib/hooks/useWindowScroll';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { getCollectivePageRoute } from '../../lib/url-helpers';
import { cn } from '../../lib/utils';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import { DashboardContext } from '../dashboard/DashboardContext';
import AccountSwitcher from '../dashboard/NewAccountSwitcher';
import DividerIcon from '../DividerIcon';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import SearchModal from '../Search';
import SearchTrigger from '../SearchTrigger';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '../ui/NavigationMenu';
import ProfileMenu from './ProfileMenu';
import SiteMenu from './SiteMenu';

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

// const MainNavItem = styled(Link)`
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   max-width: 340px;
//   flex-shrink: 1;
//   color: #0f172a;
//   font-size: 14px;
//   height: 32px;
//   padding: 0 12px;
//   border-radius: 100px;
//   white-space: nowrap;
//   transition-property: color, background-color;
//   transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
//   transition-duration: 150ms;
//   text-overflow: ellipsis;
//   overflow: hidden;

//   ${props =>
//     props.href &&
//     css`
//       @media (hover: hover) {
//         :hover {
//           color: #0f172a !important;
//           background-color: #f1f5f9;
//         }
//       }
//     `}
//   ${props =>
//     props.href &&
//     css`
//       &:hover {
//         color: #0f172a !important;
//         background-color: #f1f5f9;
//       }
//     }
//   `}
//   ${props => props.primary && `border: 1px solid #d1d5db;`}
//   font-weight: ${props => (props.lightWeight ? `400` : '500')};
//   ${props => props.isActive && `background-color: #f1f5f9;`}

//   span {
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }
// `;

const MainNavItem = props => {
  return (
    <Link
      {...props}
      className={clsx(
        'flex h-8 shrink items-center gap-2 truncate whitespace-nowrap rounded-full px-1 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 md:px-3',
        props.isActive && 'bg-slate-100',
      )}
    >
      {props.children}
    </Link>
  );
};

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
  const { activeSlug, defaultSlug, setDefaultSlug } = React.useContext(DashboardContext);

  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');
  const onHomeRoute = isRouteActive('/home');
  const onSearchRoute =
    isRouteActive('/search') || (account && isRouteActive(`/${account.parentCollective?.slug || account.slug}`));
  const ocLogoRoute = LoggedInUser ? '/dashboard' : '/home';
  const hasBreadCrumbNav = true; // LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.BREADCRUMB_NAV);

  return (
    <Fragment>
      <div className="border-b bg-white px-3 md:px-6" ref={ref}>
        <div className="flex h-16 items-center justify-between gap-1 py-4 md:gap-2">
          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
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
            <div className="flex shrink grow basis-0 items-center justify-start gap-1 md:gap-2">
              {onDashboardRoute ? (
                <React.Fragment>
                  <MainNavItem href="/dashboard">
                    <span className="truncate">
                      <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                    </span>
                  </MainNavItem>
                  {/* */}
                  <DividerIcon size={32} className="-ml-4 -mr-3 shrink-0 text-slate-300" />
                  <AccountSwitcher activeSlug={activeSlug} defaultSlug={defaultSlug} setDefaultSlug={setDefaultSlug} />
                  {/* <Tooltip>
                    <TooltipTrigger>
                      <Link
                        href={getCollectivePageRoute(account)}
                        className={cn(
                          'group shrink-0 items-center justify-center rounded-full border border-transparent px-0 text-sm font-medium leading-6 antialiased transition-colors hover:border-border',
                          'text-foreground hover:bg-slate-50',
                          'flex h-8 w-8',
                        )}
                      >
                        <Globe2 className="block text-muted-foreground group-hover:text-foreground" size={16} />
                      
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Go to public profile</TooltipContent>
                  </Tooltip> */}
                  <Link
                    href={getCollectivePageRoute(account)}
                    className={cn(
                      'group shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium leading-6 antialiased transition-colors hover:border-border sm:border-transparent',
                      'text-muted-foreground hover:bg-slate-50 hover:text-foreground',
                      'flex h-8 w-8 px-0 sm:w-auto sm:px-3',
                    )}
                  >
                    <Globe2 className="block text-muted-foreground group-hover:text-foreground sm:hidden" size={16} />

                    <span className="  hidden items-center gap-x-1.5 sm:flex">
                      Public profile
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground group-hover:animate-arrow-right group-hover:text-inherit"
                      />
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
              ) : onHomeRoute ? (
                <div className="flex flex-1 items-center gap-2">
                  <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
                  <div className="flex flex-1 justify-center">
                    <NavigationMenu>
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1fr_.75fr]">
                              <ListItem href="/docs" title="For Collectives">
                                Make your community sustainable
                              </ListItem>
                              <li className="row-span-3">
                                <Image
                                  src={'/static/images/how-it-works/builtWithResilient-illustration.png'}
                                  width="200"
                                  height="200"
                                />
                                {/* <NavigationMenuLink asChild>
                                  <a
                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                    href="/"
                                  >
                                    <CircleIcon className="h-6 w-6" />
                                    <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                                    <p className="text-sm leading-tight text-muted-foreground">
                                      Beautifully designed components built with Radix UI and Tailwind CSS.
                                    </p>
                                  </a>
                                </NavigationMenuLink> */}
                              </li>
                              <ListItem href="/docs/installation" title="For Sponsors">
                                Support projects & communities
                              </ListItem>

                              <ListItem href="/docs/primitives/typography" title="For Fiscal Hosts">
                                Fiscal sponsorship has never been easier
                              </ListItem>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1fr_.75fr]">
                              <ListItem href="/docs" title="Pricing">
                                Our Pricing Structure
                              </ListItem>
                              <li className="row-span-3">
                                <Image
                                  src={'/static/images/how-it-works/openIsBetter-illustration.png'}
                                  width="200"
                                  height="200"
                                />
                                {/* <NavigationMenuLink asChild>
                                  <a
                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                    href="/"
                                  >
                                    <CircleIcon className="h-6 w-6" />
                                    <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                                    <p className="text-sm leading-tight text-muted-foreground">
                                      Beautifully designed components built with Radix UI and Tailwind CSS.
                                    </p>
                                  </a>
                                </NavigationMenuLink> */}
                              </li>
                              <ListItem href="/docs/installation" title="How Open Collective works">
                                Open Collective enables all kinds of groups to raise, manage, and spend money
                                transparently. Our open source software platform engages contributors and supporters,
                                automates admin, and helps you tell your story.
                              </ListItem>
                              <ListItem href="/docs/primitives/typography" title="Fiscal Hosting">
                                Think of your community, project, or initiative as a plant, and a fiscal host as a
                                lovingly tended garden.
                              </ListItem>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1fr_.75fr]">
                              <ListItem href="/docs" title="Blog">
                                Stay up to date with what is happening with Open Collective
                              </ListItem>
                              <li className="row-span-3">
                                <Image
                                  src={'/static/images/how-it-works/transparentByDesign-illustration.png'}
                                  width="200"
                                  height="200"
                                />
                                {/* <NavigationMenuLink asChild>
                                  <a
                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                    href="/"
                                  >
                                    <CircleIcon className="h-6 w-6" />
                                    <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                                    <p className="text-sm leading-tight text-muted-foreground">
                                      Beautifully designed components built with Radix UI and Tailwind CSS.
                                    </p>
                                  </a>
                                </NavigationMenuLink> */}
                              </li>
                              <ListItem href="/docs/installation" title="Exit to Community">
                                Join us as we transition from a privately owned company to a structure that allows us to
                                share power and revenue with you.
                              </ListItem>
                              <ListItem href="/docs/primitives/typography" title="About">
                                Introduction to Open Collective in the docs.
                              </ListItem>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </NavigationMenuList>
                    </NavigationMenu>
                  </div>
                </div>
              ) : (
                <MainNavItem href={'#'}>{navTitle}</MainNavItem>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-4">
              <MainNavItem href="/dashboard" isActive={onDashboardRoute}>
                <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
              </MainNavItem>
              <MainNavItem href="/search" isActive={onSearchRoute}>
                <FormattedMessage id="Explore" defaultMessage="Explore" />
              </MainNavItem>
            </div>
          )}
          <div className="flex grow-0 items-center gap-1 md:gap-2">
            <SearchTrigger setShowSearchModal={setShowSearchModal} />

            <div className="hidden sm:block">
              <ChangelogTrigger />
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>
      <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
      {isMobile && (onDashboardRoute || onSearchRoute) && !hasBreadCrumbNav && (
        <MobileFooterMenu {...{ onDashboardRoute, onSearchRoute }} />
      )}
    </Fragment>
  );
};
const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  },
);
ListItem.displayName = 'ListItem';
export default TopBar;
