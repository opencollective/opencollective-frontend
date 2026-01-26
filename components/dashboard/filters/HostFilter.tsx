import React from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { gql } from '../../../lib/graphql/helpers';
import type { AccountHoverCardFieldsFragment } from '../../../lib/graphql/types/v2/graphql';
import { AccountType } from '../../../lib/graphql/types/v2/schema';

import { AccountHoverCard, accountHoverCardFields } from '../../AccountHoverCard';
import Avatar from '../../Avatar';

import ComboSelectFilter from './ComboSelectFilter';

const hostFilterSearchQuery = gql`
  query HostFilterSearch($searchTerm: String, $orderBy: OrderByInput) {
    accounts(searchTerm: $searchTerm, type: [HOST], isHost: true, orderBy: $orderBy, limit: 30) {
      nodes {
        id
        ...AccountHoverCardFields
      }
    }
  }
  ${accountHoverCardFields}
`;

const hostFilterQuery = gql`
  query HostFilter($slug: String!) {
    account(slug: $slug) {
      id
      ...AccountHoverCardFields
    }
  }
  ${accountHoverCardFields}
`;

const HostRenderer = (props: {
  account: Partial<AccountHoverCardFieldsFragment> & {
    slug: string;
  };
  inOptionsList?: boolean;
}) => {
  const { data } = useQuery(hostFilterQuery, {
    variables: { slug: props.account.slug },
    fetchPolicy: 'cache-first',
    skip: !!props.account.description && !!props.account.type,
  });
  const account = data?.account ?? props.account;

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
      {...(props.inOptionsList && { hoverCardContentProps: { side: 'right', sideOffset: 24 } })}
      trigger={trigger}
    />
  );
};

const schema = z.string().optional();

export const hostFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: (value, key) => ({ [key]: value ? { slug: value } : undefined }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Fiscal Host', id: 'Fiscalhost' }),
    Component: HostFilterComponent,
    valueRenderer: ({ value, meta, ...props }) => (
      <HostRenderer account={{ slug: value }} inOptionsList={meta?.inOptionsList} {...props} />
    ),
  },
};

export type HostFilterMeta = {
  hosts?: Partial<AccountHoverCardFieldsFragment>[];
};

const resultNodeToOption = account => ({
  label: <HostRenderer account={account} inOptionsList />,
  keywords: [account.name, account.slug],
  value: account.slug,
});

function HostFilterComponent({
  meta,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, HostFilterMeta> &
  React.ComponentProps<typeof ComboSelectFilter>) {
  const defaultHosts = React.useMemo(() => meta?.hosts?.map(resultNodeToOption) || [], [meta?.hosts]);
  const [options, setOptions] = React.useState<{ label: React.ReactNode; value: string }[]>(defaultHosts);

  const [search, { loading, data }] = useLazyQuery(hostFilterSearchQuery, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      if (!searchTerm && defaultHosts.length) {
        setOptions(defaultHosts);
      } else {
        search({
          variables: {
            searchTerm,
            ...(!searchTerm && { orderBy: { field: 'ACTIVITY', direction: 'DESC' } }),
          },
        });
      }
    },
    [defaultHosts, search],
  );

  React.useEffect(() => {
    if (!loading) {
      setOptions(data?.accounts?.nodes.map(resultNodeToOption) || defaultHosts);
    }
  }, [loading, data, defaultHosts]);

  return <ComboSelectFilter options={options} loading={loading} searchFunc={searchFunc} {...props} />;
}

export default HostFilterComponent;
