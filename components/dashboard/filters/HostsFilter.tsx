import React from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import { Account, AccountHoverCardFieldsFragment, AccountQuery } from '../../../lib/graphql/types/v2/graphql';

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

const hostsFilterSearchQuery = gql`
  query HostsFilterSearch($searchTerm: String, $orderBy: OrderByInput) {
    accounts(searchTerm: $searchTerm, isHost: true, orderBy: $orderBy) {
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
  account = data?.account || account;

  return (
    <AccountHoverCard
      account={account}
      {...(inOptionsList && { hoverCardContentProps: { side: 'right', sideOffset: 24 } })}
      trigger={
        <div className="flex h-full w-full max-w-48 items-center justify-between gap-2 overflow-hidden">
          <Avatar collective={account} radius={20} />
          <div className="relative flex flex-1 items-center justify-between gap-1 overflow-hidden">
            <span className="truncate">{account.name ?? account.slug}</span>
          </div>
        </div>
      }
    />
  );
};

const schema = z.string().optional();

export const hostsFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: (value, key) => ({ [key]: { slug: value } }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Host', id: 'Member.Role.HOST' }),
    Component: HostsFilter,
    valueRenderer: ({ value, meta, ...props }) => (
      <AccountRenderer account={{ slug: value }} inOptionsList={meta?.inOptionsList} {...props} />
    ),
  },
};

const resultNodeToOption = account => ({
  label: <AccountRenderer account={account} inOptionsList />,
  keywords: [account.name],
  value: account.slug,
});

function HostsFilter({ ...props }: FilterComponentProps<z.infer<typeof schema>, {}>) {
  const [options, setOptions] = React.useState<{ label: React.ReactNode; value: string }[]>([]);

  const [search, { loading, data }] = useLazyQuery(hostsFilterSearchQuery, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      search({
        variables: {
          searchTerm,
          ...(!searchTerm && { orderBy: { field: 'ACTIVITY', direction: 'DESC' } }),
        },
      });
    },
    [search],
  );

  React.useEffect(() => {
    if (!loading) {
      setOptions(data?.accounts?.nodes.map(resultNodeToOption) || []);
    }
  }, [loading, data]);

  return <ComboSelectFilter options={options} loading={loading} searchFunc={searchFunc} {...props} />;
}
