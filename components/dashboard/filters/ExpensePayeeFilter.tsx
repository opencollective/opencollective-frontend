import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import type { AccountHoverCardFieldsFragment, HostContext } from '@/lib/graphql/types/v2/graphql';
import type { ExpenseStatusFilter } from '@/lib/graphql/types/v2/schema';

import { accountHoverCardFields } from '../../AccountHoverCard';
import type { FilterValues as ExpenseFilterValues } from '../sections/expenses/filters';

import ComboSelectFilter from './ComboSelectFilter';
import { AccountRenderer } from './HostedAccountFilter';

const expensePayeeFilterSearchQuery = gql`
  query ExpensePayeeFilterSearch(
    $host: AccountReferenceInput
    $account: AccountReferenceInput
    $searchTerm: String
    $status: [ExpenseStatusFilter]
    $hostContext: HostContext
  ) {
    expenses(host: $host, account: $account, status: $status, hostContext: $hostContext) {
      payees(searchTerm: $searchTerm, limit: 20) {
        nodes {
          id
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export type ExpensePayeeFilterMeta = {
  hostSlug?: string;
  accountSlug?: string;
};

const schema = isMulti(z.string()).optional();

const resultNodeToOption = (account: Partial<AccountHoverCardFieldsFragment>) => ({
  label: <AccountRenderer account={account as AccountHoverCardFieldsFragment & { slug: string }} inOptionsList />,
  keywords: [account.name],
  value: account.slug,
});

type RequiredFilterValueTypes = {
  hostContext?: HostContext;
  status?: ExpenseFilterValues['status'];
};

function ExpensePayeeFilter({
  meta,
  values,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, ExpensePayeeFilterMeta, RequiredFilterValueTypes>) {
  const [options, setOptions] = React.useState<{ label: React.ReactNode; keywords: string[]; value: string }[]>([]);
  const [search, { loading, data }] = useLazyQuery(expensePayeeFilterSearchQuery, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      search({
        variables: {
          host: meta.hostSlug ? { slug: meta.hostSlug } : undefined,
          account: meta.accountSlug ? { slug: meta.accountSlug } : undefined,
          searchTerm: searchTerm || undefined,
          hostContext: values.hostContext,
          status: values.status,
        },
      });
    },
    [meta.hostSlug, meta.accountSlug, search, values.hostContext, values.status],
  );

  // Load initial options on mount
  React.useEffect(() => {
    search({
      variables: {
        host: meta.hostSlug ? { slug: meta.hostSlug } : undefined,
        account: meta.accountSlug ? { slug: meta.accountSlug } : undefined,
        searchTerm: undefined,
        hostContext: values.hostContext,
        status: values.status,
      },
    });
  }, [meta.hostSlug, meta.accountSlug, search, values.hostContext, values.status]);

  React.useEffect(() => {
    if (!loading && data?.expenses?.payees?.nodes) {
      setOptions(data.expenses.payees.nodes.map(resultNodeToOption));
    }
  }, [loading, data]);

  return <ComboSelectFilter options={options} loading={loading} searchFunc={searchFunc} isMulti {...props} />;
}

export const expensePayeeFilter: FilterConfig<z.infer<typeof schema>> = {
  schema: schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Payee', id: 'SecurityScope.Payee' }),
    Component: ExpensePayeeFilter,
    valueRenderer: ({ value, ...props }) => <AccountRenderer account={{ slug: value }} {...props} />,
  },
  toVariables: values => ({ fromAccounts: values.map(slug => ({ slug })) }),
};
