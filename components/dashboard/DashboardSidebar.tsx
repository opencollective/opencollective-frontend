import * as React from 'react';
import { ChevronDown, LifeBuoy, Telescope } from 'lucide-react';
import { useIntl } from 'react-intl';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';

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
  useSidebar,
} from '../ui/Sidebar';
import { useWorkspace } from '../WorkspaceProvider';

import AccountSwitcher from './AccountSwitcher';
import { DashboardContext } from './DashboardContext';
import type { MenuItem } from './Menu';
import { getMenuItems } from './Menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { cx } from 'class-variance-authority';

type AppSidebarProps = {
  menuItems: MenuItem[];
  isLoading: boolean;
  useLegacy?: boolean;
  variant?: 'inset' | 'sidebar' | 'floating';
};

export function DashboardSidebar({ variant = 'sidebar' }: AppSidebarProps) {
  const { workspace } = useWorkspace();
  const { account, selectedSection, subpath } = React.useContext(DashboardContext);
  const activeSlug = workspace?.slug;
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const menuItems = React.useMemo(() => getMenuItems({ intl, account, LoggedInUser }), [account, intl, LoggedInUser]);

  const isSectionActive = (section: string) => {
    const sectionAndSubpath = subpath?.length > 0 ? `${selectedSection}/${subpath[0]}` : selectedSection;

    return section && (sectionAndSubpath === section || selectedSection === section);
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
                    return <DashboardSidebarMenuGroup item={item} isSectionActive={isSectionActive} />;
                  }

                  // Handle regular page items
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton asChild isActive={isSectionActive(item.section)} tooltip={item.label}>
                        <Link href={getDashboardRoute(account, item.section)} shallow>
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

function DashboardSidebarMenuGroup({ item, isSectionActive }) {
  const hasActiveSubItem = item.subMenu?.some(subItem => isSectionActive(subItem.section));

  const { account } = React.useContext(DashboardContext);
  const [open, setOpen] = React.useState(hasActiveSubItem);
  const { isMobile, state } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const desktopSidebarCollapsed = !isMobile && state === 'collapsed';
  const isRootItemActive = hasActiveSubItem && (!open || desktopSidebarCollapsed);

  const trigger = (
    <SidebarMenuButton isActive={isRootItemActive} tooltip={item.label}>
      {item.Icon && <item.Icon />}
      <span>{item.label}</span>
      <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
    </SidebarMenuButton>
  );

  return (
    <Collapsible key={item.label} asChild open={open} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger onClick={() => setOpen(open => !open)} asChild>
          {desktopSidebarCollapsed ? (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                onCloseAutoFocus={e => {
                  e.preventDefault();
                }}
              >
                <DropdownMenuLabel className="text-xs font-medium">{item.label}</DropdownMenuLabel>
                {item.subMenu.map(subItem => (
                  <DropdownMenuItem
                    asChild
                    className={cx(isSectionActive(subItem.section) && 'font-medium text-sidebar-accent-foreground')}
                  >
                    <Link href={getDashboardRoute(account, subItem.section)} shallow>
                      {subItem.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            trigger
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subMenu?.map(subItem => (
              <SidebarMenuSubItem key={subItem.section}>
                <SidebarMenuSubButton asChild isActive={isSectionActive(subItem.section)}>
                  <Link href={getDashboardRoute(account, subItem.section)} shallow>
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
