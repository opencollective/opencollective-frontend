import React from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { gql } from '../../../lib/graphql/helpers';
import type { AccountFilterQuery, AccountHoverCardFieldsFragment } from '../../../lib/graphql/types/v2/graphql';
import type { Account } from '../../../lib/graphql/types/v2/schema';
import { isMulti } from '@/lib/filters/schemas';

import { AccountHoverCard, accountHoverCardFields } from '../../AccountHoverCard';
import Avatar from '../../Avatar';

import { accountFilterQuery } from './AccountFilter';
import ComboSelectFilter from './ComboSelectFilter';

const hostedAccountFilterSearchQuery = gql`
  query HostedAccountFilterSearch($searchTerm: String, $hostSlug: String, $orderBy: OrderByInput) {
    accounts(searchTerm: $searchTerm, host: { slug: $hostSlug }, orderBy: $orderBy) {
      nodes {
        id
        ...AccountHoverCardFields
      }
    }
  }
  ${accountHoverCardFields}
`;

export const AccountRenderer = (props: {
  account: Partial<AccountHoverCardFieldsFragment> & {
    slug: Account['slug'];
  };
  inOptionsList?: boolean; // For positioning the HoverCard to the right to prevent blocking options list
}) => {
  const { data } = useQuery<AccountFilterQuery>(accountFilterQuery, {
    variables: { slug: props.account.slug },
    fetchPolicy: 'cache-first',

    // skip query if there is already a field from the hover card data (such as description),
    // to prevent fetching all accounts when used in the combo select filter that already queries for these fields
    skip: !!props.account.description && !!props.account.type,
  });
  const account = data?.account ?? props.account;

  const trigger = (
    <div className="flex h-full w-full max-w-48 items-center justify-between gap-2 overflow-hidden">
      <Avatar collective={account} radius={20} />
      <div className="relative flex flex-1 items-center justify-between gap-1 overflow-hidden">
        <span className="truncate">{account.name || account.slug}</span>
      </div>
    </div>
  );

  if (!data?.account) {
    return trigger;
  }

  return (
    <AccountHoverCard
      account={data.account}
      {...(props.inOptionsList && { hoverCardContentProps: { side: 'right', sideOffset: 24 } })}
      trigger={trigger}
    />
  );
};

const schema = z.string().optional();

export const hostedAccountFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: (value, key) => ({ [key]: { slug: value } }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    Component: HostedAccountFilter,
    valueRenderer: ({ value, meta, ...props }) => (
      <AccountRenderer account={{ slug: value }} inOptionsList={meta.inOptionsList} {...props} />
    ),
  },
};

const multiSchema = isMulti(z.string()).optional();

export const hostedAccountsFilter: FilterConfig<z.infer<typeof multiSchema>> = {
  schema: multiSchema,
  toVariables: (value, key) => ({ [key]: value.map(slug => ({ slug })) }),
  filter: {
    labelMsg: hostedAccountFilter.filter.labelMsg,
    Component: props => <HostedAccountFilter isMulti {...props} />,
    valueRenderer: ({ value, meta, ...props }) => (
      <AccountRenderer account={{ slug: value }} inOptionsList={meta.inOptionsList} {...props} />
    ),
  },
};

const resultNodeToOption = account => ({
  label: <AccountRenderer account={account} inOptionsList />,
  keywords: [account.name],
  value: account.slug,
});

export type HostedAccountFilterMeta = {
  hostSlug: string;
  hostedAccounts?: Partial<AccountHoverCardFieldsFragment>[];
  disableHostedAccountsSearch?: boolean;
};

function HostedAccountFilter({
  meta,
  ...props
}: FilterComponentProps<z.infer<typeof schema | typeof multiSchema>, HostedAccountFilterMeta> &
  React.ComponentProps<typeof ComboSelectFilter>) {
  const defaultAccounts = React.useMemo(
    () => meta.hostedAccounts?.map(resultNodeToOption) || [],
    [meta.hostedAccounts],
  );
  const [options, setOptions] = React.useState<{ label: React.ReactNode; value: string }[]>(defaultAccounts);

  const [search, { loading, data }] = useLazyQuery(hostedAccountFilterSearchQuery, {
    variables: { hostSlug: meta.hostSlug },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      search({
        variables: {
          searchTerm: searchTerm || undefined,
          ...(!searchTerm && { orderBy: { field: 'ACTIVITY', direction: 'DESC' } }),
        },
      });
    },
    [search],
  );

  // Load initial options on mount if no default accounts provided
  React.useEffect(() => {
    if (!defaultAccounts.length) {
      searchFunc('');
    }
  }, [defaultAccounts.length, searchFunc]);

  React.useEffect(() => {
    if (!loading && data?.accounts?.nodes) {
      setOptions(data.accounts.nodes.map(resultNodeToOption));
    }
  }, [loading, data]);

  return (
    <ComboSelectFilter
      options={options}
      loading={loading}
      searchFunc={meta.disableHostedAccountsSearch ? undefined : searchFunc}
      {...props}
    />
  );
}
