import React from 'react';
import { useRouter } from 'next/router';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import ProfileMenu from '../navigation/ProfileMenu';
import { SearchCommand } from '../search/SearchCommand';
import SearchTrigger from '../SearchTrigger';
import { SidebarTrigger } from '../ui/Sidebar';

export function DashboardTopbar() {
  const [showSearchModal, setShowSearchModal] = React.useState(false);
  const router = useRouter();
const {LoggedInUser} = useLoggedInUser();

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };
  const useSearchCommandMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND);

  const onDashboardRoute = isRouteActive('/dashboard');
  return (
    <React.Fragment>
      <header
        className={`z-10 grid h-15 w-full shrink-0 grid-cols-[1fr_minmax(auto,var(--breakpoint-xl))_minmax(auto,1fr)] items-center border-b px-4 transition-[width,height,box-shadow] ease-linear`}
      >
        <div className="mr-4 flex items-center gap-3">
          <SidebarTrigger className="" />

          {/* <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 text-sm">
              <a href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </a>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Overview</span>
            </nav>
          </div> */}
        </div>

        <div className="flex items-center gap-2"></div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Button variant="ghost" size="icon" className="size-8">
            <Bell className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-medium text-primary-foreground">U</span>
          </div> */}
          <SearchTrigger setShowSearchModal={setShowSearchModal} />

          <div className="hidden sm:block">
            <ChangelogTrigger />
          </div>
          <ProfileMenu
            logoutParameters={{ skipQueryRefetch: onDashboardRoute, redirect: onDashboardRoute ? '/' : undefined }}
          />
        </div>
      </header>
      {useSearchCommandMenu ? (
        <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
      ) : (
        <SearchModal open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
      )}
      <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
    </React.Fragment>
  );
}
