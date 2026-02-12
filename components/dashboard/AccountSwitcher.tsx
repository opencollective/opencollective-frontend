import React from 'react';
import { cx } from 'class-variance-authority';
import { flatten, groupBy, uniqBy } from 'lodash';
import { ChevronDown, ChevronsUpDown, ChevronUp, Plus, UserCog } from 'lucide-react';
import memoizeOne from 'memoize-one';
import type { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type LoggedInUser from '@/lib/LoggedInUser';
import { cn } from '@/lib/utils';

import Avatar from '../Avatar';
import Link from '../Link';
import { Button } from '../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/Sidebar';

import { ROOT_PROFILE_KEY } from './constants';

const CREATE_NEW_LINKS = {
  ORGANIZATION: '/signup/organization',
  FUND: '/fund/create',
  COLLECTIVE: '/signup/collective',
};

const EMPTY_GROUP_STATE = {
  [CollectiveType.COLLECTIVE]: {
    emptyMessage: (
      <FormattedMessage defaultMessage="Create a collective to collect and spend money transparently" id="MZB6HL" />
    ),
    linkLabel: <FormattedMessage id="home.create" defaultMessage="Create a Collective" />,
  },
  [CollectiveType.ORGANIZATION]: {
    emptyMessage: (
      <FormattedMessage
        defaultMessage="A profile representing a company or organization instead of an individual"
        id="CBITv6"
      />
    ),
    linkLabel: <FormattedMessage id="host.organization.create" defaultMessage="Create an Organization" />,
  },
};

const getGroupedAdministratedAccounts = memoizeOne(loggedInUser => {
  const isAdministratedAccount = m =>
    ['ADMIN', 'ACCOUNTANT', 'COMMUNITY_MANAGER'].includes(m.role) && !m.account.isIncognito;
  let administratedAccounts = loggedInUser?.memberOf.filter(isAdministratedAccount).map(m => m.account) || [];

  // Filter out accounts if the user is also an admin of the parent of that account (since we already show the parent)
  const childAccountIds = flatten(administratedAccounts.map(a => a.childrenAccounts?.nodes || [])).map(
    (a: { id: string }) => a.id,
  );
  administratedAccounts = administratedAccounts
    .filter(a => !childAccountIds.includes(a.id))
    .filter(a => a.type !== 'VENDOR');
  administratedAccounts = uniqBy([...administratedAccounts], a => a.id).filter(Boolean);

  // Filter out Archived accounts and group it separately
  const archivedAccounts = administratedAccounts.filter(a => a.isArchived);
  const activeAccounts = administratedAccounts.filter(a => !a.isArchived);

  const groupedAccounts = {
    [CollectiveType.COLLECTIVE]: [],
    [CollectiveType.ORGANIZATION]: [],
    ...groupBy(activeAccounts, a => a.type),
  };
  if (archivedAccounts?.length > 0) {
    groupedAccounts['ARCHIVED'] = archivedAccounts;
  }
  return groupedAccounts;
});

const generateOptionDescription = (
  collective: LoggedInUser['memberOf'][number]['account'] | LoggedInUser,
  LoggedInUser: LoggedInUser,
) => {
  if (LoggedInUser && !LoggedInUser.isAdminOfCollective(collective)) {
    if (LoggedInUser.isAccountantOnly(collective)) {
      return <FormattedMessage id="Member.Role.ACCOUNTANT" defaultMessage="Accountant" />;
    } else if (LoggedInUser.isCommunityManagerOnly(collective)) {
      return <FormattedMessage id="Member.Role.COMMUNITY_MANAGER" defaultMessage="Community Manager" />;
    }
  }

  return (
    <FormattedMessage
      id="AccountSwitcher.Description"
      defaultMessage="{type, select, USER {Personal profile} COLLECTIVE {Collective admin} ORGANIZATION {Organization admin} EVENT {Event admin} FUND {Fund admin} PROJECT {Project admin} other {}}"
      values={{ type: collective?.type }}
    />
  );
};

const Option = ({
  collective,
  description,
  isChild,
  isDisplay,
}: {
  collective: any;
  description?: string | ReactElement;
  isChild?: boolean;
  className?: string;
  isDisplay?: boolean;
}) => {
  const { LoggedInUser } = useLoggedInUser();
  description = description || generateOptionDescription(collective, LoggedInUser);
  return (
    <div className="flex items-center gap-2">
      <Avatar collective={collective} size={isDisplay ? 32 : isChild ? 20 : 24} useIcon={isChild} className={''} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{collective?.name}</span>
        {isDisplay && <span className="truncate text-xs">{description}</span>}
      </div>
    </div>
  );
};

const RootOption = () => (
  <div className="flex items-center gap-2">
    <UserCog size={24} className="shrink-0 text-slate-600" />
    <div className="flex min-w-0 flex-col overflow-hidden">
      <span className="truncate text-sm font-medium">Platform Admin</span>
    </div>
  </div>
);

const MenuEntry = ({
  account,
  activeSlug,
  handleClose,
}: {
  account: any;
  activeSlug: string;
  handleClose: () => void;
}) => {
  const children = account.childrenAccounts?.nodes || [];
  const hasActiveChild = !!children.some(child => child.slug === activeSlug);
  const [expanded, setExpanded] = React.useState(hasActiveChild);
  const isActive = activeSlug === account.slug || (hasActiveChild && !expanded);

  React.useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true);
    }
  }, [hasActiveChild]);
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <DropdownMenuItem
        className={cn(isActive && 'bg-slate-100')}
        onSelect={e => {
          // Prevent navigation only if clicking the expand button
          const target = e.target as HTMLElement;
          const button = target.closest('button[data-expand-button]');
          if (button) {
            e.preventDefault();
          }
        }}
      >
        <Link
          href={`/dashboard/${account.slug}`}
          title={account.name}
          shallow
          onClick={() => handleClose()}
          className="flex min-w-0 flex-1 items-center"
        >
          <Option collective={account} className="flex-1" />
        </Link>
        {children.length > 0 && (
          <CollapsibleTrigger asChild>
            <Button
              data-expand-button
              variant="ghost"
              size="icon-xs"
              className="ml-2 h-6 w-6 shrink-0 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              onClick={e => e.stopPropagation()}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </CollapsibleTrigger>
        )}
      </DropdownMenuItem>
      {children.length > 0 && (
        <CollapsibleContent className="m-0 p-0">
          {children
            .slice() // Create a copy to that we can sort the otherwise immutable array
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(child => {
              const isChildActive = activeSlug === child.slug;
              return (
                <DropdownMenuItem key={child.id} asChild className={cn('pl-6', isChildActive && 'bg-slate-100')}>
                  <Link href={`/dashboard/${child.slug}`} title={child.name} shallow onClick={handleClose}>
                    <Option collective={child} isChild />
                  </Link>
                </DropdownMenuItem>
              );
            })}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};

const AccountSwitcher = ({ activeSlug }: { activeSlug: string }) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();

  const [open, setOpen] = React.useState(false);
  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [
    ...rootAccounts,
    ...flatten(rootAccounts.map(a => a.childrenAccounts?.nodes || [])),
  ];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || LoggedInUser;
  const handleClose = () => setOpen(false);
  const { isMobile, state } = useSidebar();

  const desktopSidebarCollapsed = !isMobile && state === 'collapsed';
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={intl.formatMessage({ defaultMessage: 'Switch workspace', id: '5ELw4E' })}
              className="group-data-[collapsible=icon]:my-2! data-[state=open]:bg-sidebar-accent"
            >
              {activeSlug === ROOT_PROFILE_KEY ? <RootOption /> : <Option collective={activeAccount} isDisplay />}
              <ChevronsUpDown size={18} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cx(
              'max-h-[70vh] overflow-y-auto',
              desktopSidebarCollapsed ? 'w-60' : 'w-(--radix-dropdown-menu-trigger-width)',
            )}
            align="start"
            sideOffset={8}
            onCloseAutoFocus={e => {
              e.preventDefault();
            }}
          >
            <DropdownMenuItem
              asChild
              className={cn(activeSlug === LoggedInUser?.slug && 'bg-slate-100')}
              onSelect={handleClose}
            >
              <Link
                href={`/dashboard/${LoggedInUser?.slug}`}
                title={LoggedInUser?.name}
                className="min-w-0 flex-1"
                shallow
              >
                <Option collective={LoggedInUser} />
              </Link>
            </DropdownMenuItem>
            {LoggedInUser?.isRoot && (
              <DropdownMenuItem asChild className={cn(activeSlug === ROOT_PROFILE_KEY && 'bg-slate-100')}>
                <Link
                  href={`/dashboard/${ROOT_PROFILE_KEY}/all-collectives`}
                  title="Platform Admin"
                  className="min-w-0 flex-1"
                  shallow
                >
                  <RootOption />
                </Link>
              </DropdownMenuItem>
            )}
            {Object.entries(groupedAccounts).map(([collectiveType, accounts]) => {
              return (
                <div key={collectiveType} className="mt-2 mb-1">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-medium whitespace-nowrap text-muted-foreground uppercase">
                      <FormattedMessage
                        id="AccountSwitcher.Category.Titles"
                        defaultMessage="{type, select, USER {My workspace} COLLECTIVE {My Collectives} ORGANIZATION {My Organizations} EVENT {My Events} FUND {My Funds} PROJECT {My Projects} ARCHIVED {Archived} other {}}"
                        values={{ type: collectiveType }}
                      />
                    </span>
                    <DropdownMenuSeparator className="flex-1" />
                    {CREATE_NEW_LINKS[collectiveType] && accounts.length > 0 && (
                      <Link href={CREATE_NEW_LINKS[collectiveType]} onClick={handleClose}>
                        <Button variant="ghost" size="icon-xs" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                          <Plus size={12} />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {EMPTY_GROUP_STATE[collectiveType] && accounts.length === 0 && (
                    <div className="mx-1 flex flex-col">
                      <p className="text-xs text-muted-foreground">{EMPTY_GROUP_STATE[collectiveType].emptyMessage}</p>
                      <Button asChild variant="outline" size="xs">
                        <Link
                          className="my-2"
                          href={CREATE_NEW_LINKS[collectiveType] || '/create'}
                          onClick={handleClose}
                        >
                          <Plus size={12} />
                          {EMPTY_GROUP_STATE[collectiveType].linkLabel}
                        </Link>
                      </Button>
                    </div>
                  )}
                  {accounts
                    ?.sort((a, b) => a.name.localeCompare(b.name))
                    .map(account => (
                      <MenuEntry key={account.id} account={account} activeSlug={activeSlug} handleClose={handleClose} />
                    ))}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default AccountSwitcher;
