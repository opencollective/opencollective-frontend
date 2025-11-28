import React from 'react';
import { useRouter } from 'next/router';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import ProfileMenu from '../navigation/ProfileMenu';
import SearchModal from '../Search';
import { SearchCommand } from '../search/SearchCommand';
import SearchTrigger from '../SearchTrigger';
import { SidebarTrigger } from '../ui/Sidebar';

export function DashboardTopbar() {
  const [showSearchModal, setShowSearchModal] = React.useState(false);
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  const isRouteActive = route => {
    const regex = new RegExp(`^${route}(/?.*)?$`);
    return regex.test(router.asPath);
  };
  const useSearchCommandMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND);

  const onDashboardRoute = isRouteActive('/dashboard');
  return (
    <React.Fragment>
      <header
        className={`flex h-16 w-full shrink-0 items-center justify-between border-b px-3 transition-[width,box-shadow] ease-linear md:px-6`}
      >
        <div className="mr-4 -ml-1 flex items-center gap-3">
          <SidebarTrigger />
        </div>

        <div className="ml-auto flex items-center gap-2">
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
    </React.Fragment>
  );
}
