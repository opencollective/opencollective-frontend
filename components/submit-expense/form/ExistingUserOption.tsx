import React from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { X } from 'lucide-react';

import { gqlV1 } from '../../../lib/graphql/helpers';
import useDebounced from '../../../lib/hooks/useDebounced';

import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';
import { InviteeOption } from './experiment';

type ExistingUserOptionProps = {
  form: ExpenseForm;
};

export function ExistingUserOption(props: ExistingUserOptionProps) {
  const [inviteeSearchTerm, setInviteeSearchTerm] = React.useState('');

  const debouncedSearchTerm = useDebounced(inviteeSearchTerm, 1000);
  const searchQuery = useQuery(
    gqlV1`
    query ExistingUserOption(
      $searchTerm: String
      $isSearching: Boolean!
    ) {
      search(
        term: $searchTerm
      ) @include(if: $isSearching) {
        id
        collectives {
          id
          slug
        }
      }
    }
  `,
    {
      variables: {
        searchTerm: debouncedSearchTerm?.trim(),
        isSearching: !isEmpty(debouncedSearchTerm?.trim()) && !props.form.values.inviteeExistingAccount,
      },
    },
  );

  const { setFieldValue } = props.form;

  const isSearching = !isEmpty(inviteeSearchTerm?.trim()) && !props.form.values.inviteeExistingAccount;
  const isSearchLoading = isSearching && searchQuery.loading;
  const searchResults = searchQuery.data?.search?.collectives || [];

  if (props.form.values.inviteeOption === InviteeOption.EXISTING && !props.form.values.inviteeExistingAccount) {
    return (
      <div>
        <div>Search existing user</div>

        <div>
          <Command shouldFilter={false}>
            <CommandInput loading={isSearchLoading} value={inviteeSearchTerm} onValueChange={setInviteeSearchTerm} />

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {searchResults.map(a => (
                <CommandItem
                  key={a.slug}
                  value={a.slug}
                  onSelect={() => setFieldValue('inviteeExistingAccount', a.slug)}
                >
                  <ExpenseAccountItem slug={a.slug} />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      </div>
    );
  } else if (props.form.values.inviteeExistingAccount) {
    return (
      <div className="flex items-center">
        <ExpenseAccountItem slug={props.form.values.inviteeExistingAccount} />
        <Button size="icon-xs" variant="ghost">
          <X onClick={() => setFieldValue('inviteeExistingAccount', null)} size={16} />
        </Button>
      </div>
    );
  }

  return 'Search existing user';
}
