import * as React from 'react';
import { PopoverAnchor } from '@radix-ui/react-popover';
import { cx } from 'class-variance-authority';
import clsx from 'clsx';
import { useCommandState } from 'cmdk';
import { flatten, groupBy, uniqBy } from 'lodash';
import { Check, ChevronsUpDown, PlusCircle, Star } from 'lucide-react';
import memoizeOne from 'memoize-one';
// eslint-disable-next-line no-restricted-imports -- components/Link does not currently accept a ref, whichis required when used 'asChild' of Button
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { useWindowResize } from '../../../lib/hooks/useWindowResize';
import formatCollectiveType from '../../../lib/i18n/collective-type';
import { getDashboardRoute } from '../../../lib/url-helpers';
import { cn } from '../../../lib/utils';
import { VIEWPORTS } from '../../../lib/withViewport';

import Avatar from '../../Avatar';
import DividerIcon from '../../DividerIcon';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip';

const CREATE_NEW_BUTTONS = {
  [CollectiveType.COLLECTIVE]: {
    linkLabel: <FormattedMessage id="collective.create" defaultMessage="Create Collective" />,
    getRoute: () => '/create',
  },
  [CollectiveType.ORGANIZATION]: {
    linkLabel: <FormattedMessage id="organization.create" defaultMessage="Create Organization" />,
    getRoute: () => '/organizations/new',
  },
  [CollectiveType.EVENT]: {
    linkLabel: <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />,
    getRoute: slug => `/${slug}/events/create`,
  },
  [CollectiveType.PROJECT]: {
    linkLabel: <FormattedMessage id="SectionProjects.CreateProject" defaultMessage="Create Project" />,
    getRoute: slug => `/${slug}/projects/create`,
  },
};

const AccountItem = ({ account, active, isChild, setOpen, activeAccount, defaultSlug, setDefaultSlug, selected }) => {
  const router = useRouter();
  return (
    <CommandItem
      key={account.slug}
      onSelect={() => {
        router.push(`/dashboard/${account.slug}`);
        setOpen(false);
      }}
      value={account.slug}
      className={cn(
        'group flex items-center justify-between gap-1',
        selected && !active && !isChild && 'bg-slate-200',
        active ? 'aria-selected:bg-slate-100' : 'aria-selected:bg-transparent',
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <Avatar collective={account} radius={16} />
        <span className="truncate">{account.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {!isChild && (
          <Tooltip>
            <TooltipTrigger tabIndex={-1}>
              <Star
                onClick={e => {
                  const isDefault = defaultSlug === account.slug;
                  if (!isDefault) {
                    e.stopPropagation();
                    setDefaultSlug(account.slug);
                  }
                }}
                size={16}
                className={clsx(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  defaultSlug !== account.slug && 'hidden text-slate-400 group-hover:block',
                )}
              />
            </TooltipTrigger>
            {defaultSlug !== account.slug && <TooltipContent side="right">Set as default</TooltipContent>}
          </Tooltip>
        )}
        {activeAccount?.slug === account.slug && <Check className={'h-4 w-4'} />}
      </div>
    </CommandItem>
  );
};

const AccountsCommand = ({
  active,
  isChild,
  onActive,
  selectedValue,
  setSelectedValue,
  inputPlaceholder,
  groupedAccounts,
  setOpen,
  activeAccount,
  archivedAccounts,
  selectedParentSlug,
  setDefaultSlug,
  defaultSlug,
}: {
  active: boolean;
  isChild?: boolean;
  onActive: () => void;
  selectedValue: string;
  setSelectedValue: (v: string) => void;
  inputPlaceholder: string;
  groupedAccounts: Record<string, any[]>;
  setOpen: (v: boolean) => void;
  activeAccount: any;
  loggedInUserCollective: any;
  archivedAccounts: any[];
  defaultSlug?: string;
  setDefaultSlug?: (slug: string) => void;
  selectedParentSlug?: string;
}) => {
  const intl = useIntl();
  const router = useRouter();

  const HiddenGroup = ({ accounts }) => {
    const search = useCommandState(state => state.search);
    if (!search && !activeAccount.isArchived) {
      return null;
    }
    return (
      <CommandGroup key={'archived'} heading={'Archived'}>
        {accounts.map(account => (
          <AccountItem
            key={account.slug}
            account={account}
            activeAccount={activeAccount}
            setOpen={setOpen}
            active={active}
            selected={selectedValue === account.slug}
            isChild={isChild}
            defaultSlug={defaultSlug}
            setDefaultSlug={setDefaultSlug}
          />
        ))}
      </CommandGroup>
    );
  };
  return (
    <Command
      className={cn('w-60 rounded-none', isChild && 'border-l', active ? 'bg-white' : 'bg-slate-50')}
      onMouseOver={() => onActive()}
      onFocus={e => {
        if (e.relatedTarget instanceof HTMLInputElement) {
          onActive();
        }
      }}
      value={selectedValue}
      onValueChange={v => setSelectedValue(v)}
    >
      <CommandInput placeholder={inputPlaceholder} autoFocus={active} />
      <CommandList className="max-h-[min(420px,calc(var(--radix-popper-available-height)-70px))]">
        <CommandEmpty>
          <FormattedMessage defaultMessage="No account found." id="Wk6yrM" />
        </CommandEmpty>
        {Object.entries(groupedAccounts).map(([collectiveType, accounts]) => {
          return (
            <CommandGroup
              key={collectiveType}
              heading={
                collectiveType === CollectiveType.INDIVIDUAL
                  ? intl.formatMessage({ defaultMessage: 'Personal Account', id: 'Sch2bu' })
                  : formatCollectiveType(intl, collectiveType, 2)
              }
            >
              {accounts.map(account => {
                return (
                  <AccountItem
                    key={account.slug}
                    account={account}
                    activeAccount={activeAccount}
                    setOpen={setOpen}
                    active={active}
                    selected={selectedValue === account.slug}
                    isChild={isChild}
                    defaultSlug={defaultSlug}
                    setDefaultSlug={setDefaultSlug}
                  />
                );
              })}
              {CREATE_NEW_BUTTONS[collectiveType] && (
                <CommandItem
                  value={`${collectiveType}-create`}
                  onSelect={() => {
                    const route = CREATE_NEW_BUTTONS[collectiveType].getRoute(selectedParentSlug);
                    router.push(route);
                  }}
                  className={cn(
                    'flex items-center gap-2 text-muted-foreground hover:text-foreground',
                    active ? 'aria-selected:bg-slate-100' : 'aria-selected:bg-transparent',
                  )}
                >
                  <PlusCircle strokeWidth={1} absoluteStrokeWidth size={16} className="text-slate-500" />{' '}
                  <span className="truncate">{CREATE_NEW_BUTTONS[collectiveType].linkLabel}</span>
                </CommandItem>
              )}
            </CommandGroup>
          );
        })}

        {archivedAccounts.length > 0 && <HiddenGroup accounts={archivedAccounts} />}
      </CommandList>
    </Command>
  );
};

const getGroupedAdministratedAccounts = memoizeOne(loggedInUser => {
  let administratedAccounts =
    loggedInUser?.memberOf.filter(m => m.role === 'ADMIN' && !m.collective.isIncognito).map(m => m.collective) || [];

  // Filter out accounts if the user is also an admin of the parent of that account (since we already show the parent)
  const childAccountIds = flatten(administratedAccounts.map(a => a.children)).map((a: { id: number }) => a.id);
  administratedAccounts = administratedAccounts.filter(a => !childAccountIds.includes(a.id));
  administratedAccounts = uniqBy([...administratedAccounts], a => a.id).filter(Boolean);

  // Filter out Archived accounts and group it separately
  const archivedAccounts = administratedAccounts.filter(a => a.isArchived);
  const activeAccounts = administratedAccounts.filter(a => !a.isArchived);

  const groupedAccounts = {
    [CollectiveType.INDIVIDUAL]: [loggedInUser.collective],
    [CollectiveType.ORGANIZATION]: [],
    [CollectiveType.COLLECTIVE]: [],
    ...groupBy(activeAccounts, a => a.type),
  };
  //   groupedAccounts.archived = archivedAccounts;
  // }
  return { groupedAccounts, archivedAccounts };
});

const getGroupedChildAccounts = memoizeOne(accounts => {
  // Filter out Archived accounts and group it separately
  const archivedAccounts = accounts.filter(a => a.isArchived);
  const activeAccounts = accounts.filter(a => !a.isArchived);

  const groupedAccounts = {
    [CollectiveType.PROJECT]: [],
    [CollectiveType.EVENT]: [],
    ...groupBy(activeAccounts, a => a.type),
  };

  return { groupedAccounts, archivedAccounts };
});

export default function AccountSwitcher({ activeSlug, defaultSlug, setDefaultSlug }) {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const { viewport } = useWindowResize();
  const isMobile = [VIEWPORTS.XSMALL, VIEWPORTS.SMALL].includes(viewport);

  const loggedInUserCollective = LoggedInUser?.collective;
  const { groupedAccounts, archivedAccounts } = getGroupedAdministratedAccounts(LoggedInUser);
  const rootAccounts = flatten(Object.values({ ...groupedAccounts, archived: archivedAccounts }));
  const allAdministratedAccounts = [
    ...rootAccounts,
    ...flatten(
      rootAccounts.map(
        a =>
          a.children?.map(c => ({
            ...c,
            parentCollective: { id: a.id, slug: a.slug, name: a.name, imageUrl: a.imageUrl },
          })) ?? [],
      ),
    ),
  ];
  const activeAccount = allAdministratedAccounts.find(a => a.slug === activeSlug) || loggedInUserCollective;

  // Parent account that is administrated (i.e. should be null if the parent account is not administrated)
  const parentAccount =
    activeAccount?.parentCollective?.id &&
    allAdministratedAccounts.find(a => a.id === activeAccount?.parentCollective?.id);

  const defaultRootSlug = parentAccount?.slug ?? activeSlug;

  const [selectedRootValue, setSelectedRootValue] = React.useState(defaultRootSlug);
  const [selectedChildValue, setSelectedChildValue] = React.useState(activeSlug);

  const [open, setOpen] = React.useState(false);
  const [activePane, setActivePane] = React.useState<'ROOT' | 'CHILD'>('ROOT');

  if (!loggedInUserCollective || !activeSlug) {
    return null;
  }

  const selectedRootAccount = rootAccounts.find(a => a.slug === selectedRootValue);
  const childAccounts = selectedRootAccount?.children || [];

  const { groupedAccounts: childGroupedAccounts, archivedAccounts: childArchivedAccounts } =
    getGroupedChildAccounts(childAccounts);
  const showChildPane = !isMobile && ['ORGANIZATION', 'COLLECTIVE', 'FUND'].includes(selectedRootAccount?.type);

  return (
    <Popover
      open={open}
      onOpenChange={open => {
        setOpen(open);

        if (open) {
          setSelectedRootValue(defaultRootSlug);
          if (parentAccount) {
            setSelectedChildValue(activeSlug);
            setActivePane('CHILD');
          } else {
            setActivePane('ROOT');
          }
        }
      }}
    >
      <PopoverAnchor asChild>
        <div className="flex items-center gap-2.5">
          {parentAccount && (
            <div className="hidden items-center gap-2.5 md:flex">
              <Button
                variant="outline"
                asChild
                role="combobox"
                onClick={() => router.push(`/dashboard/${parentAccount.slug}`)}
                aria-expanded={open}
                className={clsx(
                  'group h-8 justify-between gap-1.5 whitespace-nowrap rounded-full border-transparent px-2 ',
                  'max-w-[14rem]',
                )}
              >
                <Link href={getDashboardRoute(parentAccount)}>
                  <div className="flex items-center gap-2 truncate">
                    <Avatar collective={parentAccount} radius={20} />
                    <div className="truncate">{parentAccount.name}</div>
                  </div>
                </Link>
              </Button>
              <DividerIcon size={32} className="-mx-4 text-slate-300" />
            </div>
          )}

          <PopoverTrigger asChild>
            <Button
              onClick={() => !open && setOpen(true)}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={clsx(
                'group h-8 max-w-[10rem] justify-between gap-1.5 whitespace-nowrap rounded-full px-2 sm:max-w-[14rem]',
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Avatar collective={activeAccount} radius={20} />
                <div className="truncate">{activeAccount?.name}</div>
              </div>
              <ChevronsUpDown size={16} className="shrink-0 text-slate-500 group-hover:text-slate-900" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className={cx('grid w-auto overflow-hidden rounded-xl p-0', showChildPane ? 'grid-cols-2' : 'grid-cols-1')}
      >
        <AccountsCommand
          active={activePane === 'ROOT'}
          isChild={false}
          onActive={() => setActivePane('ROOT')}
          selectedValue={selectedRootValue}
          setSelectedValue={setSelectedRootValue}
          inputPlaceholder={intl.formatMessage({ defaultMessage: 'Search accounts...', id: 'VSmsWL' })}
          groupedAccounts={groupedAccounts}
          setOpen={setOpen}
          activeAccount={activeAccount}
          loggedInUserCollective={loggedInUserCollective}
          archivedAccounts={archivedAccounts}
          defaultSlug={defaultSlug}
          setDefaultSlug={setDefaultSlug}
        />

        {showChildPane && (
          <AccountsCommand
            active={activePane === 'CHILD'}
            isChild={true}
            selectedParentSlug={selectedRootValue}
            onActive={() => setActivePane('CHILD')}
            selectedValue={selectedChildValue}
            setSelectedValue={setSelectedChildValue}
            inputPlaceholder={intl.formatMessage({ defaultMessage: 'Search projects and events...', id: 'DAM4uY' })}
            groupedAccounts={childGroupedAccounts}
            setOpen={setOpen}
            activeAccount={activeAccount}
            loggedInUserCollective={loggedInUserCollective}
            archivedAccounts={childArchivedAccounts}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
