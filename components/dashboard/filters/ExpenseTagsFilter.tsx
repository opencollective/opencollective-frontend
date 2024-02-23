import React from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import ComboSelectFilter from './ComboSelectFilter';

const expenseTagFilterSchema = isMulti(z.string()).optional();

type ExpenseTagFilterValue = z.infer<typeof expenseTagFilterSchema>;

export const expenseTagFilter: FilterConfig<ExpenseTagFilterValue> = {
  schema: expenseTagFilterSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Tag' }),
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

function ExpenseTagsFilter({
  meta: { expenseTags, hostSlug, accountSlug },
  ...props
}: FilterComponentProps<ExpenseTagFilterValue, { accountSlug?: string; hostSlug?: string; expenseTags?: string[] }>) {
  const defaultOptions = expenseTags?.map(tag => ({ label: tag, value: tag })) || [];
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>(defaultOptions);

  const [search, { loading, data }] = useLazyQuery(expenseTagsQuery, {
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    variables: {
      ...(hostSlug
        ? { host: { slug: hostSlug } }
        : accountSlug
          ? {
              account: { slug: accountSlug },
            }
          : {}),
    },
  });

  const searchFunc = searchTerm => {
    if (!searchTerm) {
      setOptions(defaultOptions);
    } else {
      search({
        variables: {
          searchTerm,
        },
      });
    }
  };

  React.useEffect(() => {
    if (!loading) {
      setOptions(data?.tagStats?.nodes.map(({ tag }) => ({ label: tag, value: tag })) || defaultOptions);
    }
  }, [loading, data]);

  return <ComboSelectFilter isMulti options={options} loading={loading} creatable searchFunc={searchFunc} {...props} />;
}
