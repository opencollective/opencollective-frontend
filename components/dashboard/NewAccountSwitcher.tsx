import React from 'react';
import { flatten, groupBy, uniqBy } from 'lodash';
import { ChevronsUpDown, Plus, UserCog } from 'lucide-react';
import memoizeOne from 'memoize-one';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { cn } from '../../lib/utils';
import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';

import Avatar from '../Avatar';
import Link from '../Link';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Separator } from '../ui/Separator';

import { ROOT_PROFILE_KEY } from './constants';

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

const Option = ({
  collective,
  isChild,
  isMain = false,
  ...props
}: {
  collective: GraphQLV1Collective;
  isChild?: boolean;
  isMain?: boolean;
}) => {
  return (
    <div className="flex flex-1 items-center gap-3 text-left" {...props}>
      <Avatar collective={collective} size={isMain ? 32 : 24} useIcon={isChild} className={isMain && 'shadow-sm'} />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-slate-800">{collective?.name}</p>
      </div>
    </div>
  );
};

const RootOption = () => (
  <div className="flex items-center gap-3 overflow-hidden">
    <UserCog size={32} className="text-slate-600" />
    <div className="flex min-w-0 flex-col overflow-hidden">
      <p className="truncate text-sm font-medium text-slate-800">Platform Admin</p>
      <p className="truncate text-xs font-normal text-slate-700">Management profile</p>
    </div>
  </div>
);

const MenuEntry = ({
  account,
  activeSlug,
  onLinkClick,
}: {
  account: GraphQLV1Collective & { children?: GraphQLV1Collective[] };
  activeSlug: string;
  onLinkClick: () => void;
}) => {
  return (
    <Link
      href={`/dashboard/${account.slug}`}
      title={account.name}
      onClick={onLinkClick}
      className={cn(
        'mb-1 flex items-center justify-between gap-1 rounded-lg bg-white p-2 text-sm font-medium transition-colors hover:bg-slate-100',
        activeSlug === account.slug && 'bg-slate-100',
      )}
    >
      <Option collective={account} />
    </Link>
  );
};

const AccountSwitcher = ({ activeSlug }: { activeSlug: string }) => {
  const { LoggedInUser } = useLoggedInUser();
  const [isOpen, setIsOpen] = React.useState(false);

  const loggedInUserCollective = LoggedInUser?.collective;

  const groupedAccounts = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values(groupedAccounts));
  const allAdministratedAccounts = [...rootAccounts, ...flatten(rootAccounts.map(a => a.children))];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-1">
          <div className="min-w-0 flex-1">
            {activeSlug === ROOT_PROFILE_KEY ? <RootOption /> : <Option isMain collective={activeAccount} />}
          </div>
          <ChevronsUpDown size={18} className="shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-[70vh] w-[--radix-dropdown-menu-trigger-width] overflow-y-auto rounded-xl"
        align="start"
      >
        <Link
          href={`/dashboard/${loggedInUserCollective?.slug}`}
          title={loggedInUserCollective?.name}
          onClick={() => setIsOpen(false)}
          className={cn(
            'mb-1 flex items-center justify-between gap-1 rounded-lg bg-white p-2 text-sm font-medium transition-colors hover:bg-slate-100',
            activeSlug === loggedInUserCollective?.slug && 'bg-slate-100',
          )}
        >
          <Option collective={loggedInUserCollective} />
        </Link>
        {LoggedInUser?.isRoot && (
          <Link
            href={`/dashboard/${ROOT_PROFILE_KEY}/all-collectives`}
            title="Platform Admin"
            onClick={() => setIsOpen(false)}
            className={cn(
              'mb-1 flex items-center justify-between gap-1 rounded-lg bg-white p-2 text-sm font-medium transition-colors hover:bg-slate-100',
              activeSlug === ROOT_PROFILE_KEY && 'bg-slate-100',
            )}
          >
            <RootOption />
          </Link>
        )}
        {Object.entries(groupedAccounts).map(([collectiveType, accounts]) => {
          return (
            <div key={collectiveType} className="mt-3">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-xs font-medium tracking-wide whitespace-nowrap text-slate-600 uppercase">
                  <FormattedMessage
                    id="AccountSwitcher.Category.Titles"
                    defaultMessage="{type, select, USER {My workspace} COLLECTIVE {My Collectives} ORGANIZATION {My Organizations} EVENT {My Events} FUND {My Funds} PROJECT {My Projects} ARCHIVED {Archived} other {}}"
                    values={{ type: collectiveType }}
                  />
                </span>
                <Separator className="flex-1" />
                {CREATE_NEW_LINKS[collectiveType] && accounts.length > 0 && (
                  <Link href={CREATE_NEW_LINKS[collectiveType]}>
                    <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200">
                      <Plus size={12} />
                    </button>
                  </Link>
                )}
              </div>
              {EMPTY_GROUP_STATE[collectiveType] && accounts.length === 0 && (
                <div className="mx-1 flex flex-col">
                  <p className="text-xs text-muted-foreground">{EMPTY_GROUP_STATE[collectiveType].emptyMessage}</p>
                  <Link
                    className="my-3 inline-flex items-center rounded-lg border border-input px-6 py-4 text-accent-foreground shadow-sm transition-colors hover:bg-slate-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    href="/create"
                    onClick={() => setIsOpen(false)}
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
                  <MenuEntry
                    key={account.id}
                    account={account}
                    activeSlug={activeSlug}
                    onLinkClick={() => setIsOpen(false)}
                  />
                ))}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher;
