import React from 'react';
import { useQuery } from '@apollo/client';
import { groupBy, isEmpty } from 'lodash';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useIntl } from 'react-intl';

import { gqlV1 } from '../../../lib/graphql/helpers';
import { AccountType } from '../../../lib/graphql/types/v2/graphql';
import useDebounced from '../../../lib/hooks/useDebounced';
import formatCollectiveType from '../../../lib/i18n/collective-type';

import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/Command';

import { ExpenseAccountItem } from './ExpenseAccountItem';

type ExpenseAccountSearchInputProps = {
  value: string;
  onChange: (slug: string) => void;
  showAdmins?: boolean;
  accountTypes?: AccountType[];
  accounts?: {
    slug: string;
    name?: string;
    type: AccountType;
    imageUrl?: string;
    parent?: {
      slug: string;
    };
    admins?: {
      account: {
        type: AccountType;
        slug: string;
        name: string;
        imageUrl: string;
      };
    };
  }[];
};

export function ExpenseAccountSearchInput(props: ExpenseAccountSearchInputProps) {
  const intl = useIntl();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const debouncedSearchTerm = useDebounced(searchTerm, 1000);

  const isFixedOptions = 'accounts' in props;

  const hasSelection = !!props.value;
  const isSearching = !isFixedOptions && !isEmpty(debouncedSearchTerm?.trim()) && !hasSelection;

  const searchQuery = useQuery(
    gqlV1`
    query AccountSearchInput(
      $searchTerm: String
      $isSearching: Boolean!
      $showAdmins: Boolean!
      $accountTypes: [TypeOfCollective]
    ) {
      search(
        term: $searchTerm
        types: $accountTypes
      ) @include(if: $isSearching) {
        id
        collectives {
          id
          slug
          name
          type
          imageUrl

          parent: parentCollective {
            id
            slug
          }

          admins: members(role: "ADMIN") @include(if: $showAdmins) {
            id
            role
            account: member {
              id
              type
              slug
              name
              imageUrl
            }
          }
        }
      }
    }
  `,
    {
      variables: {
        accountTypes: props.accountTypes,
        searchTerm: debouncedSearchTerm?.trim(),
        isSearching,
        showAdmins: !!props.showAdmins,
      },
      skip: isFixedOptions,
    },
  );

  const isSearchLoading = isSearching && searchQuery.loading;
  const isSearchError = isSearching && !searchQuery.loading && searchQuery.error;
  const searchResults = searchQuery.data?.search?.collectives || [];
  const noSearchResults = isSearching && !searchQuery.loading && searchResults.length === 0;

  const accounts = 'accounts' in props ? props.accounts : searchResults;

  const accountsGroupedByType = groupBy(accounts, 'type');
  const accountTypeOrder = props.accountTypes || [
    AccountType.COLLECTIVE,
    AccountType.ORGANIZATION,
    AccountType.PROJECT,
    AccountType.EVENT,
    AccountType.FUND,
    AccountType.VENDOR,
    AccountType.INDIVIDUAL,
  ];

  return (
    <React.Fragment>
      <div className="rounded-md border">
        {!hasSelection && (
          <Command shouldFilter={isFixedOptions}>
            <CommandInput
              value={searchTerm}
              onValueChange={v => {
                setSearchTerm(v);
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isSearchLoading && <LoadingPlaceholder height={48} width={1} />}
                {isSearchError && <MessageBoxGraphqlError error={searchQuery.error} />}
                {noSearchResults && <EmptyState />}
                {!isSearching && !hasSelection && <DefaultState />}
                {isFixedOptions && <EmptyState />}
              </CommandEmpty>
              {accountTypeOrder.map(type => {
                if (isEmpty(accountsGroupedByType[type])) {
                  return null;
                }

                return (
                  <CommandGroup key={type}>
                    <div className="mb-2 font-semibold text-muted-foreground">
                      {formatCollectiveType(intl, type, 2)}
                    </div>
                    {accountsGroupedByType[type].map(a => (
                      <CommandItem key={a.slug} onSelect={() => props.onChange(a.slug)}>
                        <ExpenseAccountItem
                          account={{ ...a, admins: { nodes: a.admins || [] } }}
                          showAdmins={props.showAdmins}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        )}
        {hasSelection && (
          <div className="flex w-full items-center px-4 text-sm leading-none">
            <ExpenseAccountItem className="mr-2 py-2" slug={props.value} showAdmins={props.showAdmins} />
            <Button variant="ghost" size="icon-sm">
              <X onClick={() => props.onChange(null)} size={16} />
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
