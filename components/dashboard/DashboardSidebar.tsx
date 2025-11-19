import * as React from 'react';
import { ChevronDown, LifeBuoy, Telescope } from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

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

import AccountSwitcher from './AccountSwitcher';
import { DashboardContext } from './DashboardContext';
import type { MenuItem } from './Menu';
import { getMenuItems } from './Menu';

type AppSidebarProps = {
  menuItems: MenuItem[];
  isLoading: boolean;
  useLegacy?: boolean;
  variant?: 'inset' | 'sidebar' | 'floating';
};

export function DashboardSidebar({ variant = 'inset' }: AppSidebarProps) {
  const { workspace } = useWorkspace();
  const { account } = React.useContext(DashboardContext);
  const activeSlug = workspace?.slug;
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const menuItems = React.useMemo(() => getMenuItems({ intl, account, LoggedInUser }), [account, intl, LoggedInUser]);

  const isSectionActive = (section: string) => {
    return router.query.section === section || router.asPath.includes(`section=${section}`);
  };

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
                {menuItems?.map(item => {
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
