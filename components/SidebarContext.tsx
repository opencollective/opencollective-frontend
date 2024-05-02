'use client';

import React, { useState } from 'react';
import {
  Archive,
  ArrowRightLeft,
  BookOpen,
  BookUserIcon,
  Building,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  HeartHandshake,
  Home,
  Inbox,
  LifeBuoy,
  LineChart,
  LucideIcon,
  Receipt,
  Settings,
  Store,
  Telescope,
} from 'lucide-react';
import { Account, AccountType } from '@/lib/graphql/types/v2/graphql';
import useLocalStorage from '@/lib/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '@/lib/local-storage';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getGroupedAdministratedAccounts } from './dashboard/AccountSwitcher';
import { flatten } from 'lodash';
type Page = {
  href: string;
  label: React.ReactNode;
};

const { ORGANIZATION, COLLECTIVE, EVENT, PROJECT, INDIVIDUAL } = AccountType;
const USER = 'USER';
type SidebarContextType = {
  recentlyVisited: Page[];
  registerPage: (page: Page) => void;
  layout: LayoutOption;
  setLayout: (layout: LayoutOption) => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

// const administratedAccounts: Partial<Account>[] = [
//   {
//     name: 'Gustav Larsson',
//     imageUrl: 'https://images.opencollective.com/gustavlrsn/04a30b2/avatar.png',
//     slug: 'gustavlrsn',
//     type: AccountType.INDIVIDUAL,
//     isHost: false,
//     isActive: false,
//   },
//   {
//     name: 'Open Source Collective',
//     slug: 'opensource',
//     imageUrl: 'https://images.opencollective.com/opensource/426badd/logo.png',
//     type: AccountType.ORGANIZATION,
//     isHost: true,
//     isActive: true,
//   },
//   {
//     name: 'Destiny Item Manager',
//     slug: 'dim',
//     imageUrl: 'https://images.opencollective.com/dim/9b47de8/logo.png',
//     type: AccountType.COLLECTIVE,
//     isActive: true,
//     isHost: false,
//   },
// ];

type MenuItem = {
  label: string;
  href?: string;
  items?: MenuItem[];
  Icon?: LucideIcon;
};

const getMenuItems = (account: Partial<Account>): { rootItems: MenuItem[]; moreItems: MenuItem[] } => ({
  rootItems: [
    {
      label: 'Overview',
      href: `/dashboard/${account.slug}`,
      Icon: Home,
      if: true,
    },
    {
      label: 'Profile',
      href: `/${account.slug}`,
      Icon: Globe2,
      if: true,
    },
    //   {
    //     label: "Explore",p
    //     href: `/explore`,
    //     Icon: Telescope,
    //   },
    {
      label: 'Expenses',
      href: `/dashboard/${account.slug}/expenses`,
      Icon: Receipt,
      if: [COLLECTIVE, EVENT, PROJECT].includes(account.type),
    },
    {
      label: 'Expenses',
      href: `/dashboard/${account.slug}/submitted-expenses`,
      Icon: Receipt,
      if: [USER].includes(account.type),
    },
    {
      label: 'Pay Expenses',
      href: `/dashboard/${account.slug}/host-expenses`,
      Icon: Receipt,
      if: [ORGANIZATION].includes(account.type) && account.isHost,
    },
    {
      label: 'Hosted Collectives',
      href: `/dashboard/${account.slug}/hosted-collectives`,
      Icon: Building,
      if: [ORGANIZATION].includes(account.type) && account.isHost,
    },
    {
      label: 'Transactions',
      href: `/dashboard/${account.slug}/transactions`,
      Icon: ArrowRightLeft,
      if: !account.isHost,
    },
    {
      label: 'Transactions',
      href: `/dashboard/${account.slug}/host-transactions`,
      Icon: ArrowRightLeft,
      if: account.isHost,
    },
    {
      label: 'Settings',
      href: `/dashboard/${account.slug}/settings/info`,
      Icon: Settings,
      if: true,
    },
    // {
    //   label: "More",
    //   Icon: MoreHorizontal,
    //   onClick={() => setMoreMenuOpen(true),}
    //   items: [
    //     {
    //       label: "Submitted Expenses",
    //       href: `/dashboard/${account.slug}/submitted-expenses`,
    //     },
    //   ],
    // },
  ].filter(item => item.if),
  moreItems: [
    {
      label: 'Explore',
      href: `/search`,
      Icon: Telescope,
      group: 'Platform',
      if: true,
    },
    {
      label: 'Help & Support',
      href: `/help`,
      Icon: LifeBuoy,
      group: 'Platform',
      if: true,
    },
    {
      label: 'Documentation',
      href: `https://docs.opencollective.com`,
      Icon: BookOpen,
      group: 'Platform',
      if: true,
    },
    {
      label: 'Received Expenses',
      href: `/dashboard/${account.slug}/expenses`,
      Icon: Receipt,
      group: account.isHost ? 'Organization' : 'More tools',
      if: ![USER].includes(account.type),
    },
    {
      label: 'Submitted Expenses',
      href: `/dashboard/${account.slug}/submitted-expenses`,
      Icon: Receipt,
      group: account.isHost ? 'Organization' : 'More tools',
      if: ![USER].includes(account.type),
    },
    {
      label: 'Agreements',
      href: `/dashboard/${account.slug}/host-agreements`,
      Icon: FileText,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Host Applications',
      href: `/dashboard/${account.slug}/host-applications`,
      Icon: Inbox,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Tax Forms',
      href: `/dashboard/${account.slug}/host-tax-forms`,
      Icon: Archive,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Contributions',
      href: `/dashboard/${account.slug}/orders`,
      Icon: Coins,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Expected Funds',
      href: `/dashboard/${account.slug}/pending-contributions`,
      Icon: Coins,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Virtual Cards',
      href: `/dashboard/${account.slug}/virtual-cards`,
      Icon: CreditCard,
      if: ![USER].includes(account.type),
      group: account.isHost ? 'Fiscal Host' : 'More tools',
    },
    {
      label: 'Reports',
      href: `/dashboard/${account.slug}/reports`,
      Icon: LineChart,
      if: ![USER].includes(account.type),
      group: account.isHost ? 'Fiscal Host' : 'More tools',
    },
    {
      label: 'Tiers',
      href: `/dashboard/${account.slug}/tiers`,
      Icon: HeartHandshake,
      if: ![USER].includes(account.type),
      group: account.isHost ? 'Organization' : 'More tools',
    },
    {
      label: 'Vendors',
      href: `/dashboard/${account.slug}/vendors`,
      Icon: Store,
      if: account.isHost,
      group: 'Fiscal Host',
    },
    {
      label: 'Contributors',
      href: `/dashboard/${account.slug}/contributors`,
      Icon: BookUserIcon,
      if: ![USER].includes(account.type),
      group: account.isHost ? 'Organization' : 'More tools',
    },
  ].filter(item => item.if),
});

type SavedPages = {
  [accountSlug: string]: Page[];
};

export enum LayoutOption {
  COMBINED_TOP_LEFT = 'combined-top-left',
  COMBINED_BOTTOM_LEFT = 'combined-bottom-left',
  SPLIT_TOP_LEFT_RIGHT = 'split-top-left-right',
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { LoggedInUser } = useLoggedInUser();
  const [selectedAccountSlug, setSelectedAccountSlugInLocalStorage] = useLocalStorage(
    'selectedAccountSlugDash',
    LoggedInUser?.collective?.slug,
  );
  const [layout, setLayout] = useLocalStorage('layout', LayoutOption.SPLIT_TOP_LEFT_RIGHT);

  console.log({ loggedInUserColl: LoggedInUser?.collective });
  // const [lastWorkspaceVisit, setLastWorkspaceVisit] = useLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE, {
  //   slug: LoggedInUser?.collective.slug,
  // });

  // const defaultSlug = lastWorkspaceVisit?.slug || LoggedInUser?.collective.slug;
  // const activeSlug = defaultSlug;
  const groupedAccounts = LoggedInUser ? getGroupedAdministratedAccounts(LoggedInUser) : [];
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [
    ...rootAccounts,
    ...flatten(rootAccounts.map(a => a.children)),
    ...(LoggedInUser ? [LoggedInUser.collective] : []),
  ];

  const [expanded, setExpanded] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [recentlyVisitedStorage, setRecentlyVisitedStorage] = useLocalStorage<SavedPages>('recentlyVisited', {});
  const [pinnedStorage, setPinnedStorage] = useLocalStorage<SavedPages>('pinned', {});
  console.log({
    selectedAccountSlug,
    allAdministratedAccounts,
    groupedAccounts,
    rootAccounts,
    LoggedInUser,
  });
  const [activeLink, setActiveLink] = React.useState<string | null>(null);
  const account = allAdministratedAccounts.find(a => a.slug === selectedAccountSlug);
  const menu = account ? getMenuItems(account) : { rootItems: [], moreItems: [] };

  const recentlyVisited = (recentlyVisitedStorage[selectedAccountSlug] || []).map(page => {
    if (page.imageUrl) {
      return page;
    }
    const item = menu.moreItems.find(item => item.href === page.href);
    if (item) {
      return item;
    }
    return page;
  });

  const pinned = (pinnedStorage[selectedAccountSlug] || []).map(page => {
    if (page.imageUrl) {
      return page;
    }
    const item = menu.moreItems.find(item => item.href === page.href);
    if (item) {
      return item;
    }
    return page;
  });

  const setRecentlyVisited = (pages: Page[], dashboardSlug: string) => {
    console.log('setRecentlyVisited', pages, dashboardSlug);
    setRecentlyVisitedStorage({ ...recentlyVisitedStorage, [dashboardSlug]: pages });
  };
  const setSelectedAccountSlug = (slug: string) => {
    // router.push(`/dashboard/${slug}/overview`);
    setSelectedAccountSlugInLocalStorage(slug);
  };

  const registerPage = (page: Page, dashboardSlug?: string, where?: string) => {
    console.log('register page', page, dashboardSlug, where);
    let slug = selectedAccountSlug;
    if (dashboardSlug && dashboardSlug !== slug) {
      slug = dashboardSlug;
      setSelectedAccountSlug(dashboardSlug);
    }
    setActiveLink(page.href);

    const account = allAdministratedAccounts.find(a => a.slug === slug);
    const menu = account ? getMenuItems(account) : { rootItems: [], moreItems: [] };

    if (!account || menu.rootItems.find(item => item.href === page.href)) {
      return;
    }
    const indexInRecentlyVisited = (recentlyVisitedStorage[slug] ?? []).findIndex(p => p.href === page.href);

    console.log({ indexInRecentlyVisited, recentlyVisited: recentlyVisitedStorage[slug] });
    // if the page is already in the recently visited list, do nothing
    if (indexInRecentlyVisited !== -1) {
      console.log('returning zero');
      return;
    }

    const indexInPinned = (pinnedStorage[slug] ?? []).findIndex(p => p.href === page.href);
    if (indexInPinned !== -1) {
      return;
    }

    const itemFromMore = menu.moreItems.find(item => item.href === page.href);
    if (itemFromMore) {
      page = itemFromMore;
    }

    const newRecentlyVisited = [page, ...(recentlyVisitedStorage[slug] ?? [])].slice(0, 5);
    setRecentlyVisited(newRecentlyVisited, slug);
  };

  const togglePin = (href: string, active) => {
    const index = (pinnedStorage[selectedAccountSlug] ?? []).findIndex(p => p.href === href);
    let newPinned;
    if (index === -1) {
      const newPage = recentlyVisitedStorage[selectedAccountSlug].find(p => p.href === href);
      if (newPage) {
        newPinned = [newPage, ...(pinnedStorage[selectedAccountSlug] ?? [])].slice(0, 5);

        // remove from recently visited
        const newRecentlyVisited = (recentlyVisitedStorage[selectedAccountSlug] ?? []).filter(p => p.href !== href);
        setRecentlyVisited(newRecentlyVisited, selectedAccountSlug);
      } else {
        return;
      }
    } else {
      newPinned = [...pinnedStorage[selectedAccountSlug]];
      newPinned.splice(index, 1);
      // add to recently visited
      if (active) {
        const newRecentlyVisited = [
          pinnedStorage[selectedAccountSlug][index],
          ...(recentlyVisitedStorage[selectedAccountSlug] ?? []),
        ].slice(0, 5);
        setRecentlyVisited(newRecentlyVisited, selectedAccountSlug);
      }
    }
    setPinnedStorage({ ...pinnedStorage, [selectedAccountSlug]: newPinned });
  };

  console.log({ account, menu, selectedAccountSlug });
  return (
    <SidebarContext.Provider
      value={{
        recentlyVisited,
        pinned,
        registerPage,
        menuItems: menu,
        selectedAccountSlug,
        setSelectedAccountSlug,
        accounts: allAdministratedAccounts,
        activeAccount: account,
        activeLink,
        expanded,
        setExpanded,
        moreMenuOpen,
        setMoreMenuOpen,
        account,
        togglePin,
        layout,
        setLayout,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a CounterProvider');
  }
  return context;
}
