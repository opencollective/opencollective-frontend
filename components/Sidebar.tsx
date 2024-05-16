'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { LayoutOption, useSidebar } from '@/components/SidebarContext';
import AvatarOG from '@/components/Avatar';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  LucideIcon,
  MoreHorizontal,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { groupBy } from 'lodash';
import React from 'react';
import NewAccountSwitcher from './dashboard/preview/AccountSwitcher';
import AccountSwitcher from './dashboard/AccountSwitcher';

import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import SearchModal from './Search';
import { LOCAL_STORAGE_KEYS } from '@/lib/local-storage';
import useLocalStorage from '@/lib/hooks/useLocalStorage';

export function Sidebar({ className }) {
  const {
    recentlyVisited,
    selectedAccountSlug,
    setSelectedAccountSlug,
    menuItems,
    accounts,
    activeLink,
    setExpanded,
    expanded,
    moreMenuOpen,
    setMoreMenuOpen,
    pinned,
    layout,
  } = useSidebar();
  const [openSearchModal, setOpenSearchModal] = React.useState(false);
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const activeAccount = accounts.find(a => a.slug === selectedAccountSlug);
  const [accessToken] = useLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  console.log({ activeAccount, selectedAccountSlug });
  const moreMenu = groupBy(menuItems.moreItems, 'group');
  const moreMenuGroups = Object.keys(moreMenu).map(group => {
    return {
      group,
      items: moreMenu[group],
    };
  });
  if (!LoggedInUser && !loadingLoggedInUser && !accessToken) {
    return null;
  }
  return (
    <React.Fragment>
      <aside
        className={cn('sticky top-0 z-[3000] h-screen shrink-0 bg-white transition-all', expanded ? 'w-64' : 'w-16')}
      >
        <nav className={cn('flex h-full flex-col border-r', className)}>
          <div className="w-full flex-1 overflow-y-auto pb-3">
            {layout === LayoutOption.COMBINED_BOTTOM_LEFT && (
              <div className="relative flex justify-end p-3">
                {expanded && (
                  <Image
                    alt="Open Collective logo"
                    src="/static/images/oc-logo-watercolor-256.png"
                    width={32}
                    height={32}
                    className={cn('pointer-events-none absolute left-4 top-4 transition-all')}
                  />
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-10 text-muted-foreground"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                </Button>
              </div>
            )}
            {LoggedInUser && (
              <React.Fragment>
                {layout !== LayoutOption.COMBINED_BOTTOM_LEFT && (
                  <div className="mb-2 p-2.5">
                    <NewAccountSwitcher
                      activeSlug={selectedAccountSlug}
                      defaultSlug={selectedAccountSlug}
                      setDefaultSlug={() => console.log('setting default slug')}
                      expanded={expanded}
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 px-3">
                  <div className="">
                    {layout !== LayoutOption.SPLIT_TOP_LEFT_RIGHT && (
                      <SearchModal
                        trigger={
                          <SidebarItem
                            expanded={expanded}
                            Icon={Search}
                            label="Search"
                            onClick={() => setOpenSearchModal(true)}
                          />
                        }
                      />
                    )}

                    {menuItems.rootItems.map(item => (
                      <SidebarItem
                        expanded={expanded}
                        key={item.href ?? item?.name}
                        {...item}
                        active={activeLink === item.href}
                      />
                    ))}
                    <SidebarItem
                      label="More"
                      Icon={MoreHorizontal}
                      // active={moreMenuOpen}
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      expanded={expanded}
                    />
                  </div>

                  {pinned.length > 0 && (
                    <div className="space-y-0.5">
                      <div
                        className={cn(
                          'overflow-hidden whitespace-nowrap text-xs text-muted-foreground',
                          expanded ? 'w-full px-2.5' : 'w-0',
                        )}
                      >
                        Pinned
                      </div>
                      <div>
                        {pinned.map(pin => (
                          <SidebarItem
                            key={pin.href}
                            href={pin.href}
                            imageUrl={pin.imageUrl}
                            Icon={pin.Icon}
                            label={pin.label}
                            active={activeLink === pin.href}
                            pinnable={true}
                            expanded={expanded}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {recentlyVisited.length > 0 && (
                    <div className="space-y-0.5">
                      <div
                        className={cn(
                          'overflow-hidden whitespace-nowrap text-xs text-muted-foreground',
                          expanded ? 'w-full px-2.5' : 'w-0',
                        )}
                      >
                        Recently visited
                      </div>
                      <div className="flex flex-col">
                        {recentlyVisited.map(pin => (
                          <SidebarItem
                            expanded={expanded}
                            key={pin.href}
                            href={pin.href}
                            imageUrl={pin.imageUrl}
                            Icon={pin.Icon}
                            label={pin.label}
                            active={activeLink === pin.href}
                            pinnable={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            )}
          </div>

          {LoggedInUser && layout === LayoutOption.COMBINED_BOTTOM_LEFT && (
            <div className="border-t p-2.5">
              <NewAccountSwitcher
                activeSlug={selectedAccountSlug}
                defaultSlug={selectedAccountSlug}
                setDefaultSlug={() => console.log('setting default slug')}
                expanded={expanded}
              />
            </div>
          )}
          <div
            className={cn(
              'absolute left-full h-full w-64 border-r bg-white p-3 opacity-20 transition-all',
              moreMenuOpen ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-12 opacity-0',
            )}
          >
            <div className="flex items-center justify-end">
              <Button onClick={() => setMoreMenuOpen(false)} size={'icon'} variant="ghost">
                <X size={20} />
              </Button>
            </div>
            <div className="-mt-1.5 space-y-4">
              {moreMenuGroups.reverse().map(group => {
                return (
                  <div key={group.group}>
                    <div className={'mb-0.5 overflow-hidden whitespace-nowrap px-2.5 text-xs text-muted-foreground'}>
                      {group.group}
                    </div>
                    {group.items.map(item => {
                      return <SidebarItem key={item.href ?? item.name} {...item} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
        {layout !== LayoutOption.COMBINED_BOTTOM_LEFT && (
          <Button
            size="icon"
            variant="outline"
            className="absolute inset-y-0 -right-3.5 my-auto size-7 rounded-full bg-white text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </Button>
        )}
      </aside>
      {moreMenuOpen && (
        <div onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-[2000] bg-slate-900 bg-opacity-20" />
      )}
    </React.Fragment>
  );
}

export function SidebarItem({
  Icon,
  imageUrl,
  label,
  active,
  href,
  alert,
  onClick,
  pinnable,
  expanded = true,
}: {
  Icon?: LucideIcon;
  imageUrl?: string;
  label: React.ReactNode;
  active?: boolean;
  href?: string;
  alert?: boolean;
  expanded?: boolean;
}) {
  const { setMoreMenuOpen, togglePin, pinned } = useSidebar();
  let isPinned = false;
  if (pinnable) {
    isPinned = pinned.some(pin => pin.href === href);
  }
  const className = cn(
    'group relative flex h-9 w-full items-center rounded-md px-2.5 py-0 text-left text-sm transition-all',
    active ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-muted-foreground hover:bg-slate-100',
  );
  const content = (
    <>
      {Icon && <Icon className="shrink-0" size={18} />}
      {imageUrl && (
        <AvatarOG collective={{ imageUrl }} radius={18} className="shadow-sm" />
        // <Avatar className="size-[18px] rounded-sm bg-white ring-1 ring-border">
        //   <AvatarImage src={imageUrl} />
        //   <AvatarFallback>
        //     {label
        //       ?.split(' ')
        //       .map(p => p[0])
        //       .join('')}
        //   </AvatarFallback>
        // </Avatar>
      )}

      <div className={cn('truncate transition-all', expanded ? 'ml-2.5 w-full' : 'w-0')}>{label}</div>
      {alert &&
        (expanded ? (
          <Badge
            variant="secondary"
            className={cn(
              'transition-colors',
              active ? 'border-blue-200 bg-blue-100 text-blue-800' : 'group-hover:bg-blue-100',
            )}
          >
            {alert}
          </Badge>
        ) : (
          <div className={cn('absolute right-2 h-2 w-2 rounded bg-blue-400', !expanded && 'top-2')} />
        ))}
      {/* {!expanded && (
        <div
          className={`
        min-w-content invisible absolute left-full ml-6 -translate-x-3 whitespace-nowrap rounded-md 
        bg-blue-100 px-2 py-1 
        text-sm text-blue-800 opacity-20 transition-all 
        group-hover:visible group-hover:translate-x-0 group-hover:opacity-100`}
        >
          {label}
        </div>
      )} */}
      {expanded && pinnable && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                togglePin(href, active);
              }}
              className={cn(
                'flex h-full w-0 items-center justify-center bg-transparent px-1 text-transparent transition-colors group-hover:w-auto',
                active
                  ? 'hover:!text-blue-800 group-hover:text-muted-foreground'
                  : 'hover:!text-foreground group-hover:text-muted-foreground',
              )}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={16} side="right">
            {isPinned ? 'Remove pin' : 'Pin shortcut'}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );

  const menuItem = href ? (
    <Link href={href} className={className} onClick={() => setMoreMenuOpen(false)}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
  if (expanded) return menuItem;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
      <TooltipContent className="" sideOffset={16} side="right">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
