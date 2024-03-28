import React, { useCallback, useMemo, useRef } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { debounce, groupBy, intersection, kebabCase, omit, pick } from 'lodash';
import { ChevronDown, Loader, Search } from 'lucide-react';
import { useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { Account, AccountReferenceInput, AccountType } from '../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../lib/i18n/collective-type';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/Command';
import { Popover, PopoverAnchor, PopoverContent } from './ui/Popover';
import Avatar from './Avatar';
import { getTypeCaption } from './CollectiveTypePicker';
import CreateCollectiveMiniForm from './CreateCollectiveMiniForm';

const ACCOUNT_TYPE_SORTING = [
  AccountType.VENDOR,
  AccountType.INDIVIDUAL,
  AccountType.ORGANIZATION,
  AccountType.COLLECTIVE,
  AccountType.FUND,
  AccountType.EVENT,
  AccountType.PROJECT,
];

const accountPickerSearchQuery = gql`
  query AccountPickerV2Search(
    $term: String!
    $types: [AccountType]
    $limit: Int
    $hosts: [AccountReferenceInput]
    $parents: [AccountReferenceInput]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHost: AccountReferenceInput
  ) {
    accounts(
      searchTerm: $term
      type: $types
      limit: $limit
      host: $hosts
      parent: $parents
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHost: $includeVendorsForHost
    ) {
      nodes {
        id
        type
        slug
        name
        currency
        location {
          id
          address
          country
        }
        imageUrl(height: 64)
        isActive
        isArchived
        isHost
        ... on Individual {
          hasTwoFactorAuth
        }
        ... on Host {
          isTrustedHost
          hostFeePercent
        }
      }
    }
  }
`;

const SearchBar = React.forwardRef<
  React.ElementRef<'input'>,
  React.ComponentPropsWithoutRef<'input'> & { onChange: (string) => void; loading?: boolean }
>((props, ref) => {
  return (
    <div className="mx-4 flex min-h-12 items-center gap-2">
      {props.loading ? (
        <Loader size={18} className="animate-spin text-gray-500" />
      ) : (
        <Search size={18} className="text-gray-500" />
      )}
      <input
        ref={ref}
        tabIndex={-1}
        type="text"
        placeholder="Search for users, organizations, or vendors"
        className="h-6 flex-1 border-0 p-0 text-sm outline-0 ring-0 focus:ring-0"
        onKeyDown={e => e.stopPropagation()}
        onChange={e => props.onChange(e.target.value)}
      />
    </div>
  );
});
SearchBar.displayName = 'SearchBar';

const AccountLabel = ({ account }) =>
  !account ? null : (
    <div className="flex items-center gap-2">
      <Avatar collective={account} radius={24} />
      <div>{account.name}</div>
    </div>
  );

const AccountItem = ({ account, ...props }) => (
  <CommandItem
    value={account.slug || account.legacyId || account.id}
    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    data-cy={`account-picker-item-${account.slug || account.legacyId || account.id}`}
    {...props}
  >
    <AccountLabel account={account} />
  </CommandItem>
);

type AccountSelectProps = React.ComponentPropsWithoutRef<typeof Command> & {
  onChange: (account: Partial<Account>) => void;
  groupped?: boolean;
  searchable?: boolean;
  suggestions?: Partial<Account>[];
  searchQuery: typeof accountPickerSearchQuery;
  filterResults?: (accounts: Partial<Account>[]) => Partial<Account>[];

  limit?: number;
  skipGuests?: boolean;
  types?: AccountType[];
  includeArchived?: boolean;
  includeVendorsForHost?: AccountReferenceInput;
  parents?: AccountReferenceInput[];
  hosts?: AccountReferenceInput[];
};

const AccountSelect = ({
  onChange,
  searchQuery,
  types,
  limit,
  hosts,
  parents,
  searchable,
  groupped,
  skipGuests,
  suggestions,
  includeArchived,
  includeVendorsForHost,
  filterResults,
  ...props
}: AccountSelectProps) => {
  const intl = useIntl();
  const [search, { loading, data: searchResult, variables }] = useLazyQuery(searchQuery, {
    context: API_V2_CONTEXT,
    notifyOnNetworkStatusChange: true,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce(async term => {
      search({
        variables: {
          term: term || '',
          types,
          limit,
          hosts: hosts?.map(getAccountReference),
          parents: parents?.map(getAccountReference),
          skipGuests,
          includeArchived,
          includeVendorsForHost: includeVendorsForHost && getAccountReference(includeVendorsForHost),
        },
      });
    }, 750),
    [search],
  );

  const items = useMemo(() => {
    let result = searchable && variables?.term?.length > 0 ? searchResult?.accounts?.nodes : suggestions;
    if (filterResults) {
      result = filterResults(result);
    }
    return groupped ? (
      groupByType(intl, result).map(({ label, options }) => (
        <CommandGroup key={label} heading={label}>
          {options.map(account => (
            <AccountItem key={account.id} account={account} onSelect={() => onChange(account)} />
          ))}
        </CommandGroup>
      ))
    ) : (
      <CommandGroup>
        {result.map(account => (
          <AccountItem key={account.id} account={account} onSelect={() => onChange(account)} />
        ))}
      </CommandGroup>
    );
  }, [intl, suggestions, groupped, filterResults, searchResult, searchable, onChange, variables]);

  return (
    <Command shouldFilter={!searchable} {...props}>
      {searchable && <CommandInput autoFocus loading={loading} onValueChange={handleSearch} />}
      <CommandList>{items}</CommandList>
    </Command>
  );
};

const groupByType = (intl, accounts) => {
  const groups = groupBy(accounts, 'type');
  return intersection(ACCOUNT_TYPE_SORTING, Object.keys(groups)).map(type => {
    return {
      label: formatCollectiveType(intl, type, 100),
      options: groups[type],
    };
  });
};

type AccountPickerMiniForm = {
  id: string;
  Button: any;
  Form: any;
};

export const makeLegacyCreateCollectiveMiniform = (
  types: Array<keyof typeof CollectiveType>,
  { host }: { host: Pick<Account, 'legacyId'> },
) =>
  types.map(type => {
    const id = kebabCase(`create-${type}`);
    return {
      id,
      Button: props => (
        <Button variant="outline" data-cy={kebabCase(`account-picker-${id}`)} {...props}>
          {getTypeCaption(type)}
        </Button>
      ),
      Form: ({ onCancel, onSuccess }) => {
        const callSuccessWithV2Ids = account => onSuccess({ ...omit(account, ['id']), legacyId: account.id });
        return (
          <div className="p-4">
            <CreateCollectiveMiniForm
              onCancel={onCancel}
              onSuccess={callSuccessWithV2Ids}
              type={type}
              otherInitialValues={type === CollectiveType.VENDOR ? { ParentCollectiveId: host.legacyId } : {}}
            />
          </div>
        );
      },
    };
  });

type AccountPickerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  accounts?: Partial<Account>[];
  limit?: number;
  noCache?: boolean;
  searchable?: boolean;
  groupped?: boolean;
  placeholder?: string;

  searchQuery?: typeof accountPickerSearchQuery;
  skipGuests?: boolean;
  types?: AccountType[];
  includeArchived?: boolean;
  includeVendorsForHost?: AccountReferenceInput;
  parents?: AccountReferenceInput[];
  hosts?: AccountReferenceInput[];

  error?: boolean | string;
  onChange: (account: Partial<Account>) => void;
  onClose?: () => void;
  filterResults?: (accounts: Partial<Account>[]) => Partial<Account>[];
  value?: Partial<Account>;
  miniForms?: AccountPickerMiniForm[];
};

const getAccountReference = (account: Partial<Account>) => pick(account, ['id', 'slug', 'legacyId']);

const AccountPicker = ({
  value,
  accounts,
  types,
  limit = 20,
  filterResults,
  groupped,
  searchable,
  error,
  hosts,
  parents,
  skipGuests,
  includeArchived,
  includeVendorsForHost,
  searchQuery = accountPickerSearchQuery,
  onChange,
  onClose,
  ...props
}: AccountPickerProps) => {
  const [isOpen, setOpen] = React.useState(false);
  const [miniForm, setMiniForm] = React.useState(null);
  const ref = useRef(null);

  const handleChange = value => {
    onChange(value);
    setOpen(false);
  };

  const MiniFormComponent = miniForm && props.miniForms?.find(({ id }) => id === miniForm)?.Form;

  return (
    <Popover
      open={isOpen}
      onOpenChange={open => {
        if (!open && onClose) {
          onClose();
        }
        setOpen(open);
      }}
    >
      <PopoverAnchor asChild>
        <button
          ref={ref}
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            props.className,
            error && 'border-error focus:ring-error',
          )}
          onClick={() => setOpen(true)}
          {...props}
        >
          <div>{value ? <AccountLabel account={value} /> : props.placeholder}</div>
          <div>
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </div>
        </button>
      </PopoverAnchor>
      <PopoverContent align="start" className="flex flex-col p-0" style={{ width: 'var(--radix-popper-anchor-width)' }}>
        {miniForm ? (
          <MiniFormComponent
            onCancel={() => setMiniForm(null)}
            onSuccess={account => {
              setMiniForm(null);
              onChange(account);
              setOpen(false);
            }}
          />
        ) : (
          <React.Fragment>
            <AccountSelect
              onChange={handleChange}
              suggestions={accounts}
              className="flex-1"
              {...{
                types,
                limit,
                hosts,
                parents,
                skipGuests,
                includeArchived,
                includeVendorsForHost,
                searchable,
                groupped,
                searchQuery,
                filterResults,
              }}
            />

            {props.miniForms?.length > 0 && (
              <div className="flex w-full justify-stretch gap-2 border-t border-border p-4">
                {props.miniForms.map(({ id, Button }) => (
                  <Button key={id} onClick={() => setMiniForm(id)} className="flex-1" />
                ))}
              </div>
            )}
          </React.Fragment>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AccountPicker;
