'use client';

import React from 'react';
import {
  BarChart2,
  BookUserIcon,
  Building,
  Building2,
  ChevronDown,
  Ellipsis,
  HandCoins,
  Home,
  LayoutDashboard,
  Network,
  Receipt,
  Rows3,
  Settings,
  User,
  Vault,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { isChildAccount, isHostAccount, isIndividualAccount, isSelfHostedAccount } from '@/lib/collective';
import { ExpenseType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { getDashboardRoute } from '@/lib/url-helpers';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/Sidebar';

import ChangelogTrigger from '../changelog/ChangelogTrigger';
import Link from '../Link';
import ProfileMenu from '../navigation/ProfileMenu';
import { SearchCommand } from '../search/SearchCommand';
import SearchTrigger from '../SearchTrigger';

import AccountSwitcher from './NewAccountSwitcher';
import { ALL_SECTIONS, SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';
import { type MenuItem, shouldIncludeMenuItemWithLegacyFallback } from './Menu';

enum SidebarOption {
  DEFAULT = 'DEFAULT',
  GROUPING = 'GROUPING',
}
export default function DashboardLayout({
  children,
  menuItems: ogMenu,
  isLoading,
  activeSlug,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  onRoute?: () => void;
  activeSlug?: string;
  menuItems: MenuItem[];
}) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const sidebarOption = SidebarOption.GROUPING;
  //   const menuItems = React.useMemo(() => ogMenu, [isLoading, activeSlug, LoggedInUser, ogMenu]);

  const menuItems = React.useMemo(() => {
    //     const isRootProfile = account.type === 'ROOT' && LoggedInUser?.isRoot;
    //   if (isRootProfile) {
    //     return ROOT_MENU;
    //   }

    if (!account) {
      return { main: [], tools: undefined };
    }
    const isIndividual = isIndividualAccount(account);
    const isHost = isHostAccount(account);
    const isSelfHosted = isSelfHostedAccount(account);
    const isAccountantOnly = LoggedInUser?.isAccountantOnly(account);
    const isCommunityManagerOnly = LoggedInUser?.isCommunityManagerOnly(account);
    const isActive = account.isActive;
    const isActiveHost = isHost && isActive;
    const isChild = isChildAccount(account);
    const canHostAccounts = account.settings?.canHostAccounts !== false && isHost;

    const hasPlatformBillingEnabled =
      LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PLATFORM_BILLING) || account.platformSubscription;
    const hasIssuedGrantRequests = account.issuedGrantRequests?.totalCount > 0;
    const hasReceivedGrantRequests = account.receivedGrantRequests?.totalCount > 0;
    const showReceivedGrantRequests =
      hasReceivedGrantRequests ||
      (!isIndividual &&
        !(isHost || isSelfHosted) &&
        Boolean(account.supportedExpenseTypes?.includes?.(ExpenseType.GRANT)));
    if (!isHost) {
      return {
        main: ogMenu,
        tools: undefined,
      };
    }
    if (sidebarOption === SidebarOption.GROUPING) {
      if (isHost) {
        return {
          main: (
            [
              {
                section: ALL_SECTIONS.OVERVIEW,
                Icon: Home,
                if: !isAccountantOnly,
              },
              {
                if: canHostAccounts,
                section: ALL_SECTIONS.HOST_EXPENSES,
                label: 'Expenses',
                Icon: Receipt,
              },
              {
                if: (isHost && canHostAccounts) || isSelfHosted,
                label: 'Contributions',
                section: ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
                Icon: HandCoins,
              },
              {
                section: ALL_SECTIONS.INFO,
                Icon: Settings,
                label: 'Settings',
              },
            ] as MenuItem[]
          )
            .filter(item => item.if !== false)
            // filter subMenu items and add labels where missing
            .map(item => {
              if (item.type === 'group') {
                return {
                  ...item,
                  subMenu: item.subMenu
                    .filter(item => item.if !== false)
                    .map(item => ({ ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) })),
                };
              }
              return { ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) };
            }),
          tools: (
            [
              {
                type: 'group',
                label: 'Hosting',
                Icon: Network,
                subMenu: [
                  {
                    section: ALL_SECTIONS.HOSTED_COLLECTIVES,
                  },
                  {
                    label: intl.formatMessage({ id: 'HostApplications.Applications', defaultMessage: 'Applications' }),
                    section: ALL_SECTIONS.HOST_APPLICATIONS,
                  },
                ],
              },
              {
                type: 'group',
                label: 'Funds & Grants',
                Icon: Vault,
                subMenu: [
                  {
                    if: isHost && canHostAccounts,
                    section: ALL_SECTIONS.HOSTED_FUNDS,
                  },
                  {
                    if: isHost || isSelfHosted,
                    section: ALL_SECTIONS.HOSTED_GRANTS,
                    label: intl.formatMessage({ defaultMessage: 'Grant Requests', id: 'fng2Fr' }),
                  },
                ],
              },
              {
                type: 'group',
                label: 'Reporting',
                Icon: BarChart2,
                subMenu: [
                  {
                    section: ALL_SECTIONS.TRANSACTION_REPORTS,
                    label: intl.formatMessage({ defaultMessage: 'Transactions', id: 'menu.transactions' }),
                  },
                  {
                    section: ALL_SECTIONS.EXPENSE_REPORTS,
                    label: intl.formatMessage({ defaultMessage: 'Expenses', id: 'Expenses' }),
                  },
                ],
              },
              {
                type: 'group',
                label: 'Organization',
                Icon: Building2,
                subMenu: [
                  {
                    section: ALL_SECTIONS.ACCOUNTS,
                    label: intl.formatMessage({ defaultMessage: 'Accounts', id: 'FvanT6' }),
                  },
                  {
                    section: ALL_SECTIONS.EXPENSES,
                    label: intl.formatMessage(
                      {
                        defaultMessage: 'Expenses',
                        id: 'k2VBcF',
                      },
                      { accountName: account.name },
                    ),
                  },
                  {
                    if: !isIndividual && !isCommunityManagerOnly,
                    section: ALL_SECTIONS.CONTRIBUTORS,
                    label: intl.formatMessage({ id: 'Contributors', defaultMessage: 'Contributors' }),
                  },
                ],
              },
              {
                type: 'group',
                label: 'Ledger',
                Icon: Rows3,
                subMenu: [
                  {
                    section: ALL_SECTIONS.HOST_TRANSACTIONS,
                    label: intl.formatMessage({ id: 'menu.transactions', defaultMessage: 'Transactions' }),
                  },
                  {
                    section: ALL_SECTIONS.OFF_PLATFORM_TRANSACTIONS,
                    label: intl.formatMessage({ defaultMessage: 'Bank Account Sync', id: 'nVcwjv' }),
                    if: shouldIncludeMenuItemWithLegacyFallback(
                      account,
                      FEATURES.OFF_PLATFORM_TRANSACTIONS,
                      isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
                    ),
                  },
                  {
                    section: ALL_SECTIONS.LEDGER_CSV_IMPORTS,
                    label: intl.formatMessage({ defaultMessage: 'CSV Imports', id: 'd3jA/o' }),
                    if: shouldIncludeMenuItemWithLegacyFallback(
                      account,
                      FEATURES.OFF_PLATFORM_TRANSACTIONS,
                      isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
                    ),
                  },
                ],
              },
              {
                type: 'group',
                label: 'More',
                Icon: Ellipsis,
                subMenu: [
                  {
                    section: ALL_SECTIONS.HOST_TAX_FORMS,
                    label: intl.formatMessage({ defaultMessage: 'Tax Forms', id: 'skSw4d' }),
                    if: shouldIncludeMenuItemWithLegacyFallback(
                      account,
                      FEATURES.TAX_FORMS,
                      isHost && Boolean(account.host?.requiredLegalDocuments?.includes('US_TAX_FORM')),
                    ),
                  },
                  {
                    section: ALL_SECTIONS.CHART_OF_ACCOUNTS,
                  },
                  {
                    if: (isHost || isSelfHosted) && !isAccountantOnly && !isCommunityManagerOnly,
                    section: ALL_SECTIONS.VENDORS,
                  },
                  {
                    label: 'Virtual Cards',
                    section: ALL_SECTIONS.HOST_VIRTUAL_CARDS,
                  },
                  {
                    section: ALL_SECTIONS.HOST_AGREEMENTS,
                    if: shouldIncludeMenuItemWithLegacyFallback(
                      account,
                      FEATURES.AGREEMENTS,
                      isHost && canHostAccounts,
                    ),
                    label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
                  },
                ],
              },
            ] as MenuItem[]
          )
            .filter(item => item.if !== false)
            // filter subMenu items and add labels where missing
            .map(item => {
              if (item.type === 'group') {
                return {
                  ...item,
                  subMenu: item.subMenu
                    .filter(item => item.if !== false)
                    .map(item => ({ ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) })),
                };
              }
              return { ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) };
            }),
        };
      }
      return {
        main: [],
      };
    }
  }, [isLoading, activeSlug, LoggedInUser, ogMenu]);
  // Helper function to check if a section is active
  const isSectionActive = (section: string) => {
    return router.query.section === section || router.asPath.includes(`section=${section}`);
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <AccountSwitcher activeSlug={activeSlug} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems?.main.map(item => {
                  // Handle group items (with sub-menu)
                  if (item.type === 'group') {
                    const hasActiveSubItem = item.subMenu?.some(subItem => isSectionActive(subItem.section));

                    return (
                      <Collapsible
                        key={item.label}
                        asChild
                        defaultOpen={hasActiveSubItem}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label}>
                              {item.Icon && <item.Icon />}
                              <span>{item.label}</span>
                              <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subMenu?.map(subItem => (
                                <SidebarMenuSubItem key={subItem.section}>
                                  <SidebarMenuSubButton asChild isActive={isSectionActive(subItem.section)}>
                                    <Link href={getDashboardRoute(account, subItem.section)}>
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Handle regular page items
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton asChild isActive={isSectionActive(item.section)} tooltip={item.label}>
                        <Link href={getDashboardRoute(account, item.section)}>
                          {item.Icon && <item.Icon />}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {menuItems.tools && (
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems?.tools?.map(item => {
                    // Handle group items (with sub-menu)
                    if (item.type === 'group') {
                      const hasActiveSubItem = item.subMenu?.some(subItem => isSectionActive(subItem.section));

                      return (
                        <Collapsible
                          key={item.label}
                          asChild
                          defaultOpen={hasActiveSubItem}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.label}>
                                {item.Icon && <item.Icon />}
                                <span>{item.label}</span>
                                <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subMenu?.map(subItem => (
                                  <SidebarMenuSubItem key={subItem.section}>
                                    <SidebarMenuSubButton asChild isActive={isSectionActive(subItem.section)}>
                                      <Link href={getDashboardRoute(account, subItem.section)}>
                                        <span>{subItem.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    // Handle regular page items
                    return (
                      <SidebarMenuItem key={item.section}>
                        <SidebarMenuButton asChild isActive={isSectionActive(item.section)} tooltip={item.label}>
                          <Link href={getDashboardRoute(account, item.section)}>
                            {item.Icon && <item.Icon />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User />
                <span>Account</span>
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter> */}
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="px-6">
        <DashboardTopbar />
        <div className="flex flex-1 flex-col gap-4 py-4">{children}</div>
      </SidebarInset>
      <div className="fixed right-4 bottom-4 rounded-xl border bg-white p-4 shadow">Settings</div>
    </SidebarProvider>
  );
}

function DashboardTopbar() {
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
        className={`sticky top-0 z-10 grid h-15 w-full shrink-0 grid-cols-[1fr_minmax(auto,var(--breakpoint-xl))_1fr] items-center bg-background/85 backdrop-blur-sm transition-[width,height,box-shadow] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12`}
      >
        <SidebarTrigger className="mr-3 -ml-1" />

        <div className="flex items-center gap-2">
          <SearchTrigger setShowSearchModal={setShowSearchModal} />

          {/* <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-sidebar-border" />
            <nav className="flex items-center gap-1 text-sm">
              <a href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                Home
              </a>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Dashboard</span>
            </nav>
          </div> */}
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
