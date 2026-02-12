import * as React from 'react';
import { cx } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ChevronDown, Globe2, LifeBuoy, Telescope } from 'lucide-react';
import { useIntl } from 'react-intl';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getCollectivePageRoute, getDashboardRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import Link from '../Link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '../ui/Sidebar';
import { useWorkspace } from '../WorkspaceProvider';

import AccountSwitcher from './AccountSwitcher';
import { DashboardContext } from './DashboardContext';
import { getMenuItems } from './menu-items';

export function DashboardSidebar({ isLoading }: { isLoading: boolean }) {
  const { workspace: savedWorkspace } = useWorkspace();
  const { account, workspace, selectedSection, subpath } = React.useContext(DashboardContext);
  const activeSlug = savedWorkspace?.slug;
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const { setOpenMobile, isMobile } = useSidebar();
  // Use workspace data (available immediately) for menu items, with full account as enrichment
  const effectiveAccount = account || workspace;
  const menuItems = React.useMemo(
    () => getMenuItems({ intl, account: effectiveAccount, LoggedInUser }),
    [effectiveAccount, intl, LoggedInUser],
  );

  const isSectionActive = (section: string) => {
    const sectionAndSubpath = subpath?.length > 0 ? `${selectedSection}/${subpath[0]}` : selectedSection;

    return section && (sectionAndSubpath === section || selectedSection === section);
  };

  const closeMobileMenu = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <AccountSwitcher activeSlug={activeSlug} />
      </SidebarHeader>

      <SidebarContent className="justify-between">
        <div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading
                  ? [...Array(6)].map((_, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <SidebarMenuSkeleton key={i} index={i} />
                    ))
                  : menuItems
                    ? menuItems.map(item => {
                        // Handle group items (with sub-menu)
                        if (item.type === 'group') {
                          return (
                            <DashboardSidebarMenuGroup
                              key={item.label}
                              item={item}
                              isSectionActive={isSectionActive}
                              onNavigate={closeMobileMenu}
                            />
                          );
                        }

                        // Handle regular page items
                        return (
                          <SidebarMenuItem key={item.section}>
                            <SidebarMenuButton asChild isActive={isSectionActive(item.section)} tooltip={item.label}>
                              <Link
                                href={getDashboardRoute(effectiveAccount, item.section)}
                                data-cy={`menu-item-${item.section}`}
                                shallow
                                onClick={closeMobileMenu}
                              >
                                {item.Icon && <item.Icon />}
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })
                    : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            {effectiveAccount?.type !== 'ROOT' && effectiveAccount && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={intl.formatMessage({ id: 'PublicProfile', defaultMessage: 'Public profile' })}
                >
                  <SidebarLink
                    href={getCollectivePageRoute(effectiveAccount)}
                    Icon={Globe2}
                    label={intl.formatMessage({ id: 'PublicProfile', defaultMessage: 'Public profile' })}
                    data-cy="public-profile-link"
                    external
                    onClick={closeMobileMenu}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={intl.formatMessage({ defaultMessage: 'Explore', id: 'Explore' })}>
                <SidebarLink
                  href={'/search'}
                  Icon={Telescope}
                  label={intl.formatMessage({ defaultMessage: 'Explore', id: 'Explore' })}
                  external
                  onClick={closeMobileMenu}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={intl.formatMessage({ defaultMessage: 'Help & Support', id: 'Uf3+S6' })}
              >
                <SidebarLink
                  href={'/help'}
                  Icon={LifeBuoy}
                  label={intl.formatMessage({ defaultMessage: 'Help & Support', id: 'Uf3+S6' })}
                  external
                  onClick={closeMobileMenu}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

const SidebarLink = React.forwardRef<
  HTMLAnchorElement,
  {
    href: string;
    label: string;
    Icon?: LucideIcon;
    external?: boolean;
    className?: string;
    'data-cy'?: string;
    onClick?: () => void;
  }
>(({ href, label, Icon, external, className, onClick, ...props }, ref) => {
  return (
    <Link innerRef={ref} href={href} className={cn('group/sidebar-link', className)} onClick={onClick} {...props}>
      {Icon && <Icon />}
      <span>{label}</span>
      {external && (
        <ArrowUpRight
          className="absolute right-2 text-slate-700 opacity-0 transition-opacity group-hover/sidebar-link:opacity-100 [[data-state=collapsed]_&]:hidden"
          size={14}
        />
      )}
    </Link>
  );
});

function DashboardSidebarMenuGroup({ item, isSectionActive, onNavigate }) {
  const { account, workspace } = React.useContext(DashboardContext);
  const effectiveAccount = account || workspace;
  const { isMobile, state } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const hasActiveSubItem = item.subMenu?.some(subItem => isSectionActive(subItem.section));
  const [open, setOpen] = React.useState(hasActiveSubItem);

  const desktopSidebarCollapsed = !isMobile && state === 'collapsed';
  const isRootItemActive = hasActiveSubItem && (!open || desktopSidebarCollapsed);

  // Hide menu group if all it's submenu items are hidden
  if (!item.subMenu?.length) {
    return null;
  }

  const trigger = (
    <SidebarMenuButton isActive={isRootItemActive} tooltip={item.label} data-cy={`menu-item-${item.label}`}>
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
                    key={subItem.section}
                    asChild
                    className={cx(isSectionActive(subItem.section) && 'font-medium text-sidebar-accent-foreground')}
                  >
                    <Link href={getDashboardRoute(effectiveAccount, subItem.section)} shallow onClick={onNavigate}>
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
                  <Link
                    href={getDashboardRoute(effectiveAccount, subItem.section)}
                    shallow
                    data-cy={`menu-item-${subItem.section}`}
                    onClick={onNavigate}
                  >
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
