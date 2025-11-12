import { useRouter } from 'next/router';
import React from 'react';
import { SidebarTrigger } from '../ui/Sidebar';
import SearchTrigger from '../SearchTrigger';
import ChangelogTrigger from '../changelog/ChangelogTrigger';
import ProfileMenu from '../navigation/ProfileMenu';
import { SearchCommand } from '../search/SearchCommand';

export function DashboardTopbar() {
  const [showSearchModal, setShowSearchModal] = React.useState(false);
  const router = useRouter();

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };

  const onDashboardRoute = isRouteActive('/dashboard');
  return (
    <React.Fragment>
      <header
        className={`sticky top-0 z-10 grid h-15 w-full shrink-0 grid-cols-[1fr_minmax(auto,var(--breakpoint-xl))_minmax(auto,1fr)] items-center bg-background/85 backdrop-blur-sm transition-[width,height,box-shadow] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12`}
      >
        <div className="mr-8 flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 text-sm">
              <a href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </a>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Overview</span>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SearchTrigger setShowSearchModal={setShowSearchModal} />

          <div className="ml-auto flex items-center gap-2">
            {/* <Button variant="ghost" size="icon" className="size-8">
            <Bell className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-medium text-primary-foreground">U</span>
          </div> */}
            <div className="hidden sm:block">
              <ChangelogTrigger />
            </div>
            <ProfileMenu
              logoutParameters={{ skipQueryRefetch: onDashboardRoute, redirect: onDashboardRoute ? '/' : undefined }}
            />
          </div>
        </div>
      </header>
      <SearchCommand open={showSearchModal} setOpen={open => setShowSearchModal(open)} />
    </React.Fragment>
  );
}
