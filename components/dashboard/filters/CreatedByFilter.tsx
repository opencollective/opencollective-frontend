import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import type { AccountHoverCardFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import type { ExpectedFundsFilter } from '@/lib/graphql/types/v2/schema';

import { accountHoverCardFields } from '../../AccountHoverCard';

import ComboSelectFilter from './ComboSelectFilter';
import { AccountRenderer } from './HostedAccountFilter';

const createdByFilterSearchQuery = gql`
  query CreatedByFilterSearch(
    $account: AccountReferenceInput!
    $searchTerm: String
    $expectedFundsFilter: ExpectedFundsFilter
    $hostContext: HostContext
  ) {
    orders(account: $account, filter: INCOMING, expectedFundsFilter: $expectedFundsFilter, hostContext: $hostContext) {
      createdByUsers(searchTerm: $searchTerm, limit: 20) {
        nodes {
          id
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export type CreatedByFilterMeta = {
  accountSlug: string;
  expectedFundsFilter?: ExpectedFundsFilter;
};

const schema = isMulti(z.string()).optional();

const resultNodeToOption = (account: Partial<AccountHoverCardFieldsFragment>) => ({
  label: <AccountRenderer account={account as AccountHoverCardFieldsFragment & { slug: string }} inOptionsList />,
  keywords: [account.name],
  value: account.slug,
});

// This filter is currently only for Host Expected Funds,
// if generalized to other tools we should provide the correct filters through the metadata
function CreatedByFilter({ meta, ...props }: FilterComponentProps<z.infer<typeof schema>, CreatedByFilterMeta>) {
  const [options, setOptions] = React.useState<{ label: React.ReactNode; keywords: string[]; value: string }[]>([]);

  const [search, { loading, data }] = useLazyQuery(createdByFilterSearchQuery, {
    variables: { expectedFundsFilter: 'ONLY_PENDING', hostContext: 'ALL' },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      search({
        variables: {
          account: { slug: meta.accountSlug },
          searchTerm: searchTerm || undefined,
          account: { slug: meta.accountSlug },
        },
      });
    },
    [meta.accountSlug, search],
  );

  // Load initial options on mount
  React.useEffect(() => {
    search({
      variables: {
        account: { slug: meta.accountSlug },
        searchTerm: undefined,
      },
    });
  }, [meta.accountSlug, search]);

  React.useEffect(() => {
    if (!loading && data?.orders?.createdByUsers?.nodes) {
      setOptions(data.orders.createdByUsers.nodes.map(resultNodeToOption));
    }
  }, [loading, data]);

  return <ComboSelectFilter options={options} loading={loading} searchFunc={searchFunc} isMulti {...props} />;
}

export const createdByFilter: FilterConfig<z.infer<typeof schema>> = {
  schema: schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Created by', id: 'Agreement.createdBy' }),
    Component: CreatedByFilter,
    valueRenderer: ({ value, ...props }) => <AccountRenderer account={{ slug: value }} {...props} />,
  },
  toVariables: (values, key) => ({ [key]: values.map(slug => ({ slug })) }),
};
