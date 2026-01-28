import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { gql } from '../../../lib/graphql/helpers';

import ComboSelectFilter from './ComboSelectFilter';

const expenseTagFilterSchema = z.nullable(isMulti(z.string())).optional();

type ExpenseTagFilterValue = z.infer<typeof expenseTagFilterSchema>;

export const expenseTagFilter: FilterConfig<ExpenseTagFilterValue> = {
  schema: expenseTagFilterSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Tag', id: '18HJlm' }),
    Component: ExpenseTagsFilter,
  },
};

export const expenseTagsQuery = gql`
  query ExpenseTags($searchTerm: String, $host: AccountReferenceInput, $account: AccountReferenceInput) {
    tagStats: expenseTagStats(tagSearchTerm: $searchTerm, host: $host, account: $account) {
      nodes {
        id
        tag
      }
    }
  }
`;

type ExpenseTagsFilterMeta = {
  accountSlug?: string;
  hostSlug?: string;
};

function ExpenseTagsFilter({ meta, ...props }: FilterComponentProps<ExpenseTagFilterValue, ExpenseTagsFilterMeta>) {
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);

  const [search, { loading, data }] = useLazyQuery(expenseTagsQuery, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const accountVariables = React.useMemo(
    () =>
      meta.hostSlug
        ? { host: { slug: meta.hostSlug } }
        : meta.accountSlug
          ? { account: { slug: meta.accountSlug } }
          : {},
    [meta.hostSlug, meta.accountSlug],
  );

  const searchFunc = React.useCallback(
    (searchTerm: string) => {
      search({
        variables: {
          searchTerm: searchTerm || undefined,
          ...accountVariables,
        },
      });
    },
    [accountVariables, search],
  );

  // Load initial options on mount
  React.useEffect(() => {
    searchFunc('');
  }, [searchFunc]);

  React.useEffect(() => {
    if (!loading && data?.tagStats?.nodes) {
      setOptions(data.tagStats.nodes.map(({ tag }) => ({ label: tag, value: tag })));
    }
  }, [loading, data]);

  return <ComboSelectFilter isMulti options={options} loading={loading} creatable searchFunc={searchFunc} {...props} />;
}
