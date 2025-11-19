import React from 'react';
import { flatten, groupBy, uniqBy } from 'lodash';
import { ChevronDown, ChevronsUpDown, ChevronUp, Plus, UserCog } from 'lucide-react';
import memoizeOne from 'memoize-one';
import type { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import type LoggedInUser from '@/lib/LoggedInUser';
import { cn } from '@/lib/utils';

import Avatar from '../Avatar';
import Link from '../Link';
import { P, Span } from '../Text';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

import { ROOT_PROFILE_KEY } from './constants';
import { cx } from 'class-variance-authority';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/Sidebar';

const CREATE_NEW_LINKS = {
  ORGANIZATION: '/signup/organization',
  FUND: '/fund/create',
  COLLECTIVE: '/create',
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
    ['ADMIN', 'ACCOUNTANT', 'COMMUNITY_MANAGER'].includes(m.role) && !m.collective.isIncognito;
  let administratedAccounts = loggedInUser?.memberOf.filter(isAdministratedAccount).map(m => m.collective) || [];

  // Filter out accounts if the user is also an admin of the parent of that account (since we already show the parent)
  const childAccountIds = flatten(administratedAccounts.map(a => a.children)).map((a: { id: number }) => a.id);
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

const generateOptionDescription = (collective: GraphQLV1Collective, LoggedInUser: LoggedInUser) => {
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
  <div className="flex items-center gap-3">
    <UserCog size={24} className="shrink-0 text-slate-600" />
    <div className="flex min-w-0 flex-col overflow-hidden">
      <span className="truncate text-sm font-medium">Platform Admin</span>
    </div>
  </div>
);

const MenuEntry = ({ account, activeSlug, handleClose }: { account: any; activeSlug: string }) => {
  const [expanded, setExpanded] = React.useState(false);
  const isActive = activeSlug === account.slug;

  return (
    <React.Fragment>
      <DropdownMenuItem
        // className={cn(
        //   'flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium',
        //   isActive && 'bg-slate-100',
        //   !isActive && 'hover:bg-slate-100',
        // )}
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
        {account.children?.length > 0 && (
          <Button
            data-expand-button
            variant="ghost"
            size="icon-xs"
            className="ml-2 h-6 w-6 shrink-0 text-slate-400 hover:text-slate-600"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        )}
      </DropdownMenuItem>
      {expanded &&
        account.children
          ?.slice() // Create a copy to that we can sort the otherwise immutable array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(child => {
            const childIsActive = activeSlug === child.slug;
            return (
              <DropdownMenuItem
                key={child.id}
                asChild
                className="pl-6"
                // className={cn(
                //   'ml-4 flex items-center rounded-lg px-2 py-2 text-sm font-medium',
                //   childIsActive && 'bg-slate-100',
                //   !childIsActive && 'hover:bg-slate-100',
                // )}
              >
                <Link href={`/dashboard/${child.slug}`} title={child.name} shallow onClick={handleClose}>
                  <Option collective={child} isChild />
                </Link>
              </DropdownMenuItem>
            );
          })}
    </React.Fragment>
  );
};

const AccountSwitcher = ({ activeSlug }: { activeSlug: string }) => {
  const { LoggedInUser } = useLoggedInUser();

  const [open, setOpen] = React.useState(false);
  const loggedInUserCollective = LoggedInUser?.collective;

  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [...rootAccounts, ...flatten(rootAccounts.map(a => a.children))];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;
  const handleClose = () => setOpen(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              {activeSlug === ROOT_PROFILE_KEY ? <RootOption /> : <Option collective={activeAccount} isDisplay />}
              <ChevronsUpDown size={18} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="max-h-[70vh] w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuItem
              asChild
              // className={cn(
              //   'flex items-center rounded-lg px-2 py-2 text-sm font-medium',
              //   activeSlug === loggedInUserCollective?.slug && 'bg-slate-100',
              //   activeSlug !== loggedInUserCollective?.slug && 'hover:bg-slate-100',
              // )}
              onSelect={handleClose}
            >
              <Link
                href={`/dashboard/${loggedInUserCollective?.slug}`}
                title={loggedInUserCollective?.name}
                className="min-w-0 flex-1"
                shallow
              >
                <Option collective={loggedInUserCollective} />
              </Link>
            </DropdownMenuItem>
            {LoggedInUser?.isRoot && (
              <DropdownMenuItem
                asChild
                // className={cn(
                //   '-mt-4 flex items-center rounded-lg px-2 py-2 text-sm font-medium',
                //   activeSlug === ROOT_PROFILE_KEY && 'bg-slate-100',
                //   activeSlug !== ROOT_PROFILE_KEY && 'hover:bg-slate-100',
                // )}
              >
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
                <div key={collectiveType}>
                  <div className="mb-1 flex items-center gap-2 px-1">
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
                      <Link
                        className="my-3 inline-flex items-center rounded-lg border border-input px-6 py-4 text-accent-foreground shadow-xs transition-colors hover:bg-slate-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        href={CREATE_NEW_LINKS[collectiveType] || '/create'}
                        onClick={handleClose}
                      >
                        <div className="mr-3 rounded-full border bg-white p-2 text-muted-foreground">
                          <Plus size={12} />
                        </div>
                        {EMPTY_GROUP_STATE[collectiveType].linkLabel}
                      </Link>
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
