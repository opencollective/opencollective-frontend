import React from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { X } from 'lucide-react';
import Image from 'next/image';

import { gqlV1 } from '../../../lib/graphql/helpers';
import useDebounced from '../../../lib/hooks/useDebounced';

import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import type { ExpenseForm } from '../useExpenseForm';

import { ExpenseAccountItem } from './ExpenseAccountItem';

type ExpenseAccountSearchInputProps = {
  form: ExpenseForm;
};

export function ExpenseAccountSearchInput(props: ExpenseAccountSearchInputProps) {
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const debouncedSearchTerm = useDebounced(searchTerm, 1000);

  const searchQuery = useQuery(
    gqlV1`
    query AccountSearchInput(
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
        isSearching: !isEmpty(debouncedSearchTerm?.trim()) && !props.form.values.searchExpenseAccount,
      },
    },
  );

  const { setFieldValue } = props.form;

  const isSearching = !isEmpty(searchTerm?.trim()) && !props.form.values.searchExpenseAccount;
  const isSearchLoading = isSearching && searchQuery.loading;
  const isSearchError = isSearching && !searchQuery.loading && searchQuery.error;
  const searchResults = searchQuery.data?.search?.collectives || [];
  const noSearchResults = isSearching && !searchQuery.loading && searchResults.length === 0;

  return (
    <React.Fragment>
      <div className="rounded-md border">
        {!props.form.values.searchExpenseAccount && (
          <Command shouldFilter={false}>
            <CommandInput
              value={searchTerm}
              onValueChange={v => {
                setSearchTerm(v);
                if (!isEmpty(searchTerm?.trim())) {
                  setFieldValue('searchExpenseAccount', null);
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isSearchLoading && <LoadingPlaceholder height={48} width={1} />}
                {isSearchError && <MessageBoxGraphqlError error={searchQuery.error} />}
                {noSearchResults && <EmptyState />}
                {!isSearching && !props.form.values.searchExpenseAccount && <DefaultState />}
              </CommandEmpty>
              {searchResults.map(a => (
                <CommandItem key={a.slug} onSelect={() => setFieldValue('searchExpenseAccount', a.slug)}>
                  <ExpenseAccountItem slug={a.slug} />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        )}
        {props.form.values.searchExpenseAccount && (
          <div className="flex w-full items-center px-4">
            <ExpenseAccountItem slug={props.form.values.searchExpenseAccount} />
            <Button variant="ghost" size="icon-sm">
              <X onClick={() => setFieldValue('searchExpenseAccount', null)} size={16} />
            </Button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

function DefaultState() {
  return (
    <div className="flex items-center justify-center gap-4 text-lg font-bold">
      <Image alt="" width={48} height={48} src="/static/images/magnifier.png" />
      Search for Hosts, Collectives, projects and events
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center gap-4 text-lg font-bold">
      <Image alt="" width={48} height={48} src="/static/images/magnifier.png" />
      No results
    </div>
  );
}
