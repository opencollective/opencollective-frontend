import React from 'react';
import { ArrowRightLeft, ChevronDown, Home, MenuIcon, Receipt } from 'lucide-react';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { cn } from '../../lib/utils';

import LoadingPlaceholder from '../LoadingPlaceholder';
import { DrawerMenu } from '../navigation/DrawerMenu';
import StyledRoundButton from '../StyledRoundButton';

import AccountSwitcher from './AccountSwitcher';
import type { MenuItem, PageMenuItem } from './Menu';
import Menu from './Menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/Sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { ALL_SECTIONS } from './constants';
import Link from '../Link';
import { getDashboardRoute } from '@/lib/url-helpers';
import { DashboardContext } from './DashboardContext';

interface AdminPanelSideBarProps {
  isLoading?: boolean;
  onRoute?: (...args: any[]) => void;
  activeSlug?: string;
  menuItems: MenuItem[];
}

const AdminPanelSideBar = ({
  activeSlug,
  menuItems,
  isLoading,
  onRoute: _onRoute,
  ...props
}: AdminPanelSideBarProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const { viewport } = useWindowResize();
  const isMobile = [VIEWPORTS.XSMALL, VIEWPORTS.SMALL].includes(viewport);

  const onRoute = isMobile
    ? (...args) => {
        setMenuOpen(false);
        _onRoute?.(...args);
      }
    : _onRoute;

  const content = React.useMemo(
    () => (
      <div>
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className={cn('py-1.5', i === 0 ? 'mb-4' : 'mb-2')}>
              <LoadingPlaceholder height={24} borderRadius={100} maxWidth={'70%'} />
            </div>
          ))
        ) : (
          <Menu {...{ onRoute, menuItems }} />
        )}
      </div>
    ),
    [isLoading, activeSlug, viewport, LoggedInUser, menuItems],
  );
  const staticMenuItems: PageMenuItem[] = [
    {
      section: ALL_SECTIONS.OVERVIEW,
      Icon: Home,
      label: 'Overview',
    },
    { section: ALL_SECTIONS.HOST_EXPENSES, Icon: Receipt, label: 'Expenses' },
    { section: ALL_SECTIONS.HOST_TRANSACTIONS, Icon: ArrowRightLeft, label: 'Ledger' },
  ];

  const { account } = React.useContext(DashboardContext);
  // return ()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AccountSwitcher activeSlug={activeSlug} />

        {/* <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  Select Workspace
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Acme Corp.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu> */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {staticMenuItems.map(item => (
            <SidebarMenuItem key={item.section}>
              <SidebarMenuButton asChild>
                <Link href={getDashboardRoute(account, item.section)}>
                  <item.Icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
  return (
    <div
      className={cn(
        'max-h-screen w-full shrink-0 grow-0 overflow-y-scroll border-r px-5 py-0 md:w-52 xl:w-64',
        isMobile && 'sticky top-0 z-10 bg-white py-2.5',
      )}
      {...props}
    >
      <div className="top-8">
        <div className="flex flex-row-reverse gap-4 sm:flex-auto md:flex-col">
          <AccountSwitcher activeSlug={activeSlug} />
          {isMobile && (
            <React.Fragment>
              <StyledRoundButton size={50} onClick={() => setMenuOpen(true)} data-cy="mobile-menu-trigger">
                <MenuIcon size={24} />
              </StyledRoundButton>

              <React.Fragment>
                <DrawerMenu anchor="left" open={isMenuOpen} onClose={() => setMenuOpen(false)} className="p-4 pt-10">
                  {content}
                </DrawerMenu>
              </React.Fragment>
            </React.Fragment>
          )}
          {!isMobile && <React.Fragment>{content}</React.Fragment>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelSideBar;
