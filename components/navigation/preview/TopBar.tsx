import React, { Fragment, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Globe2, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { getCollectivePageRoute, getDashboardRoute } from '../../../lib/url-helpers';
import { cn } from '../../../lib/utils';

import ChangelogTrigger from '../../changelog/ChangelogTrigger';
import { DashboardContext } from '../../dashboard/DashboardContext';
import AccountSwitcher from '../../dashboard/preview/AccountSwitcher';
import DividerIcon from '../../DividerIcon';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import Link from '../../Link';
import SearchModal from '../../Search';
import SearchTrigger from '../../SearchTrigger';
import ProfileMenu from '../ProfileMenu';

import HomePageMenu from './HomePageMenu';
import SiteMenu from './SiteMenu';

const MainNavItem = props => {
  return (
    <Link
      {...props}
      className={clsx(
        'flex h-8 shrink items-center gap-2 truncate whitespace-nowrap rounded-full px-1 text-sm font-medium text-foreground transition-colors hover:bg-slate-100 md:px-3',
        props.isActive && 'bg-slate-100',
        props.className,
      )}
    >
      {props.children}
    </Link>
  );
};

type TopBarProps = {
  account?: {
    parentCollective?: {
      name: string;
      slug: string;
    };
    parent?: {
      name: string;
      slug: string;
    };
    name: string;
    slug: string;
  };
  navTitle?: string;
  loading?: boolean;
};

const DashboardProfileQuickLink = ({ slug, toProfile }) => {
  const Icon = toProfile ? Globe2 : LayoutDashboard;
  return (
    <Link
      href={toProfile ? getCollectivePageRoute({ slug }) : getDashboardRoute({ slug })}
      className={cn(
        'group shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium leading-6 antialiased transition-colors hover:border-border sm:border-transparent',
        'text-muted-foreground hover:bg-slate-50 hover:text-foreground',
        'flex h-8 w-8 px-0 sm:w-auto sm:px-3',
      )}
    >
      <Icon className="block text-muted-foreground group-hover:text-foreground sm:hidden" size={16} />

      <span className="  hidden items-center gap-x-1.5 sm:flex">
        {toProfile ? (
          <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
        ) : (
          <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
        )}
        <ArrowRight
          size={16}
          className="text-muted-foreground group-hover:animate-arrow-right group-hover:text-inherit"
        />
      </span>
    </Link>
  );
};

const TopBar = ({ account, navTitle = '' }: TopBarProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const ref = useRef();
  const router = useRouter();
  const { activeSlug, defaultSlug, setDefaultSlug } = React.useContext(DashboardContext);

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');
  const homeRoutes = [
    '/',
    '/home',
    '/collectives',
    '/become-a-sponsor',
    '/become-a-host',
    '/pricing',
    '/how-it-works',
    '/fiscal-hosting',
    '/e2c',
  ];
  const onHomeRoute = homeRoutes.some(isRouteActive);

  const ocLogoRoute = LoggedInUser ? '/dashboard' : '/home';
  const parentCollective = account?.parentCollective || account?.parent;
  return (
    <Fragment>
      <div className="border-b bg-white px-3 xl:px-6" ref={ref}>
        <div className="flex h-16 items-center justify-between gap-1 py-4 md:gap-2">
          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <SiteMenu />
            <Box flexShrink={0}>
              <Link href={ocLogoRoute}>
                <Flex alignItems="center" gridGap={2}>
                  <Image width={32} height={32} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />
                </Flex>
              </Link>
            </Box>
          </div>

          <div className="flex shrink grow basis-0 items-center justify-start gap-1 md:gap-2">
            {onDashboardRoute ? (
              <React.Fragment>
                <MainNavItem href="/dashboard">
                  <span className="truncate">
                    <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                  </span>
                </MainNavItem>
                <DividerIcon size={32} className="-ml-4 -mr-3 shrink-0 text-slate-300" />
                <AccountSwitcher activeSlug={activeSlug} defaultSlug={defaultSlug} setDefaultSlug={setDefaultSlug} />

                <DashboardProfileQuickLink slug={activeSlug} toProfile />
              </React.Fragment>
            ) : account ? (
              <React.Fragment>
                {parentCollective && (
                  <React.Fragment>
                    <DividerIcon size={32} className="-mx-2 text-slate-300" />

                    <MainNavItem href={getCollectivePageRoute(parentCollective)} className="!font-normal">
                      {parentCollective.name}
                    </MainNavItem>
                  </React.Fragment>
                )}
                <DividerIcon size={32} className="-mx-2 text-slate-300" />

                <MainNavItem href={getCollectivePageRoute(account)}>{account.name}</MainNavItem>

                {/* <DashboardProfileQuickLink slug={account.slug} toProfile={false} /> */}
              </React.Fragment>
            ) : onHomeRoute ? (
              <div className="flex flex-1 items-center gap-2">
                <Image height={20} width={120} src="/static/images/logotype.svg" alt="Open Collective" />
                <div className="flex flex-1 justify-center">
                  <HomePageMenu />
                </div>
              </div>
            ) : (
              <MainNavItem href={'#'}>{navTitle}</MainNavItem>
            )}
          </div>

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
    </Fragment>
  );
};

export default TopBar;
