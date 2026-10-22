import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown, Mail, UserPlus } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { gql } from '../lib/graphql/helpers';
import useDebouncedSearch from '../lib/hooks/useDebouncedSearch';
import { cn, isValidEmail } from '../lib/utils';

import { Button } from './ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from './ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import Avatar from './Avatar';

type UserPickerUser = {
  id: string;
  name: string;
  slug: string;
  type: string;
  imageUrl?: string | null;
};

type UserPickerSelection = { memberAccount: UserPickerUser } | { memberInfo: { email: string; name?: string } };

type UserPickerSearchData = {
  accounts: { nodes: UserPickerUser[] };
};

type UserPickerSearchVariables = {
  searchTerm: string;
  limit: number;
};

type UserPickerProps = {
  onSelect: (selection: UserPickerSelection) => void;
  excludedIds?: Array<string | number>;
  excludedEmails?: string[];
  disabled?: boolean;
  className?: string;
  'data-cy'?: string;
};

const userPickerSearchQuery = gql`
  query UserPickerSearch($searchTerm: String, $limit: Int) {
    accounts(searchTerm: $searchTerm, type: [INDIVIDUAL], limit: $limit) {
      nodes {
        id
        name
        slug
        type
        imageUrl
      }
    }
  }
`;

/**
 * A design-system user picker: searches existing users by name/slug, or lets the caller
 * add a user by email. It never mutates anything - the selection is returned to the caller.
 */
export function UserPicker({
  onSelect,
  excludedIds = [],
  excludedEmails = [],
  disabled,
  className,
  'data-cy': dataCy,
}: UserPickerProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useDebouncedSearch(setDebouncedSearch, search, { delay: 300, noDelayEmpty: true });

  const { data, loading } = useQuery<UserPickerSearchData, UserPickerSearchVariables>(userPickerSearchQuery, {
    variables: { searchTerm: debouncedSearch, limit: 10 },
    skip: !debouncedSearch,
    fetchPolicy: 'cache-first',
  });

  const trimmedSearch = search.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();
  const isEmail = Boolean(isValidEmail(trimmedSearch));
  const showEmailInvite = isEmail && !excludedEmails.includes(normalizedSearch);
  const users = (data?.accounts?.nodes || []).filter(
    user => !excludedIds.some(excludedId => String(excludedId) === String(user.id)),
  );

  const handleOpenChange = nextOpen => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
      setDebouncedSearch('');
    }
  };

  const addUser = (user: UserPickerUser) => {
    onSelect({ memberAccount: user });
    handleOpenChange(false);
  };

  const addUserByEmail = () => {
    onSelect({ memberInfo: { email: trimmedSearch } });
    handleOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={intl.formatMessage({
            id: 'UserPicker.trigger',
            defaultMessage: 'Search or invite a user',
          })}
          disabled={disabled}
          className={cn('w-full justify-between font-normal text-muted-foreground', className)}
          data-cy={dataCy || 'user-picker-trigger'}
        >
          <span className="flex w-full items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <UserPlus className="size-4" />
              <FormattedMessage id="UserPicker.trigger" defaultMessage="Search or invite a user" />
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-sm overflow-hidden p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={intl.formatMessage({
              id: 'UserPicker.searchPlaceholder',
              defaultMessage: 'Search by name, slug or email',
            })}
            value={search}
            onValueChange={setSearch}
            data-cy="user-picker-search"
          />
          <CommandList>
            {loading ? (
              <CommandLoading>
                <FormattedMessage id="UserPicker.loading" defaultMessage="Searching..." />
              </CommandLoading>
            ) : (
              <React.Fragment>
                {users.length > 0 && (
                  <CommandGroup heading={<FormattedMessage id="UserPicker.users" defaultMessage="Users" />}>
                    {users.map(user => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => addUser(user)}
                        data-cy="user-picker-option"
                      >
                        <Avatar collective={user} radius={20} displayTitle={false} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{user.name}</span>
                          <span className="truncate text-xs text-muted-foreground">@{user.slug}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {showEmailInvite && users.length === 0 && (
                  <CommandGroup>
                    <CommandItem
                      value={`invite-${trimmedSearch}`}
                      onSelect={addUserByEmail}
                      data-cy="user-picker-invite-email"
                    >
                      <Mail className="mr-2 size-4 shrink-0" />
                      <span className="truncate">
                        <FormattedMessage
                          id="UserPicker.inviteByEmail"
                          defaultMessage="Invite by email: {email}"
                          values={{ email: trimmedSearch }}
                        />
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {users.length === 0 && Boolean(trimmedSearch) && !showEmailInvite && (
                  <CommandEmpty>
                    <FormattedMessage id="UserPicker.noResults" defaultMessage="No users found" />
                  </CommandEmpty>
                )}
              </React.Fragment>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
