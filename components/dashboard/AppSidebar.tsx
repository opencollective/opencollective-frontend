import * as React from 'react';
import {
  BarChart2,
  Building2,
  ChevronDown,
  Ellipsis,
  HandCoins,
  Home,
  LifeBuoy,
  Network,
  Receipt,
  Rows3,
  Settings,
  Telescope,
  Vault,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { isHostAccount, isIndividualAccount, isSelfHostedAccount } from '@/lib/collective';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '../Link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '../ui/Sidebar';
import { useWorkspace } from '../WorkspaceProvider';

import { ALL_SECTIONS, SECTION_LABELS } from './constants';
import type { MenuItem } from './getMenuItems';
import { shouldIncludeMenuItemWithLegacyFallback } from './getMenuItems';
import AccountSwitcher from './NewAccountSwitcher';
import AdminPanelSideBar from './SideBar';
import { SidebarOption } from './SidebarSettingsPanel';

type AppSidebarProps = {
  menuItems: MenuItem[];
  isLoading: boolean;
  useLegacy?: boolean;
  sidebarOption?: SidebarOption;
  variant?: 'inset' | 'sidebar' | 'floating';
};

export function AppSidebar({
  menuItems: ogMenu,
  isLoading,
  useLegacy = false,
  sidebarOption = SidebarOption.GROUPING,
  variant = 'inset',
}: AppSidebarProps) {
  const { workspace, account } = useWorkspace();
  const activeSlug = workspace?.slug;
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
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
    const canHostAccounts = account.settings?.canHostAccounts !== false && isHost;

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
    return {
      main: ogMenu,
      tools: undefined,
    };
  }, [account, intl, LoggedInUser, ogMenu, sidebarOption]);

  const isSectionActive = (section: string) => {
    return router.query.section === section || router.asPath.includes(`section=${section}`);
  };

  if (useLegacy) {
    return <AdminPanelSideBar isLoading={isLoading} activeSlug={activeSlug} menuItems={menuItems} />;
  }

  return (
    <Sidebar variant={variant} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <AccountSwitcher activeSlug={activeSlug} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="justify-between">
        <div>
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
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false}>
                <Link href={'/search'}>
                  <Telescope />
                  <span>Explore</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false}>
                <Link href={'/help'}>
                  <LifeBuoy />
                  <span>Help & Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
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
  );
}
