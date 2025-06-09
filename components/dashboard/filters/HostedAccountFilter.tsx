import React from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { AccountHoverCardFieldsFragment, AccountQuery } from '../../../lib/graphql/types/v2/graphql';
import type { Account } from '../../../lib/graphql/types/v2/schema';
import { isMulti } from '@/lib/filters/schemas';

import { AccountHoverCard, accountHoverCardFields } from '../../AccountHoverCard';
import Avatar from '../../Avatar';

import ComboSelectFilter from './ComboSelectFilter';

const accountQuery = gql`
  query Account($slug: String!) {
    account(slug: $slug) {
      id
      ...AccountHoverCardFields
    }
  }
  ${accountHoverCardFields}
`;

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

export const AccountRenderer = ({
  account,
  inOptionsList,
}: {
  account: Partial<AccountHoverCardFieldsFragment> & {
    slug: Account['slug'];
  };
  inOptionsList?: boolean; // For positioning the HoverCard to the right to prevent blocking options list
}) => {
  const { data } = useQuery<AccountQuery>(accountQuery, {
    variables: { slug: account.slug },
    fetchPolicy: 'cache-first',
    context: API_V2_CONTEXT,
    // skip query if there is already a field from the hover card data (such as description),
    // to prevent fetching all accounts when used in the combo select filter that already queries for these fields
    skip: !!account.description && !!account.type,
  });

  const trigger = (
    <div className="flex h-full w-full max-w-48 items-center justify-between gap-2 overflow-hidden">
      <Avatar collective={account} radius={20} />
      <div className="relative flex flex-1 items-center justify-between gap-1 overflow-hidden">
        <span className="truncate">{account.name ?? account.slug}</span>
      </div>
    </div>
  );

  if (!data?.account) {
    return trigger;
  }

  return (
    <AccountHoverCard
      account={data.account}
      {...(inOptionsList && { hoverCardContentProps: { side: 'right', sideOffset: 24 } })}
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
  meta: { hostSlug, hostedAccounts, disableHostedAccountsSearch },
  ...props
}: FilterComponentProps<z.infer<typeof schema | typeof multiSchema>, HostedAccountFilterMeta> &
  React.ComponentProps<typeof ComboSelectFilter>) {
  const defaultAccounts = React.useMemo(() => hostedAccounts?.map(resultNodeToOption) || [], [hostedAccounts]);
  const [options, setOptions] = React.useState<{ label: React.ReactNode; value: string }[]>(defaultAccounts);

  const [search, { loading, data }] = useLazyQuery(hostedAccountFilterSearchQuery, {
    variables: { hostSlug },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      if (!searchTerm && defaultAccounts.length) {
        setOptions(defaultAccounts);
      } else {
        search({
          variables: {
            searchTerm,
            ...(!searchTerm && { orderBy: { field: 'ACTIVITY', direction: 'DESC' } }),
          },
        });
      }
    },
    [defaultAccounts, search],
  );

  React.useEffect(() => {
    if (!loading) {
      setOptions(data?.accounts?.nodes.map(resultNodeToOption) || defaultAccounts);
    }
  }, [loading, data, defaultAccounts]);

  return (
    <ComboSelectFilter
      options={options}
      loading={loading}
      searchFunc={disableHostedAccountsSearch ? undefined : searchFunc}
      {...props}
    />
  );
}
