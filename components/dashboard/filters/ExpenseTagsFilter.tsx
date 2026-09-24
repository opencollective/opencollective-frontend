import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { gql } from '../../../lib/graphql/helpers';

import ComboSelectFilter from './ComboSelectFilter';

export const UNTAGGED_VALUE = '__UNTAGGED';

const untaggedLabel = defineMessage({ defaultMessage: 'Untagged', id: 'Tags.Untagged' });

const expenseTagFilterSchema = isMulti(z.string()).optional();

type ExpenseTagFilterValue = z.infer<typeof expenseTagFilterSchema>;

export const expenseTagFilter: FilterConfig<ExpenseTagFilterValue> = {
  schema: expenseTagFilterSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Tag', id: '18HJlm' }),
    Component: ExpenseTagsFilter,
    valueRenderer: ({ value, intl }) => {
      if (value === UNTAGGED_VALUE) {
        return intl.formatMessage(untaggedLabel);
      }
      return value;
    },
  },
  toVariables: value => ({ tags: value.includes(UNTAGGED_VALUE) ? null : value }),
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

function ExpenseTagsFilter({
  meta,
  intl,
  ...props
}: FilterComponentProps<ExpenseTagFilterValue, ExpenseTagsFilterMeta>) {
  const { onChange, value } = props;
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);

  const [search, { loading, data }] = useLazyQuery(expenseTagsQuery, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const accountVariables = React.useMemo(
    () =>
      meta.accountSlug
        ? { account: { slug: meta.accountSlug } }
        : meta.hostSlug
          ? { host: { slug: meta.hostSlug } }
          : {},
    [meta.hostSlug, meta.accountSlug],
  );

  const [isSearching, setIsSearching] = React.useState(false);

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

  const untaggedOption = React.useMemo(
    () => ({
      label: <span className="text-muted-foreground">{intl.formatMessage(untaggedLabel)}</span>,
      value: UNTAGGED_VALUE,
    }),
    [intl],
  );

  React.useEffect(() => {
    if (!loading && data?.tagStats?.nodes) {
      setOptions(data.tagStats.nodes.map(({ tag }) => ({ label: tag, value: tag })));
    }
  }, [loading, data]);

  const displayOptions = isSearching ? options : [untaggedOption, ...options];

  // "Untagged" is mutually exclusive with other tags (the API doesn't support both).
  // When selecting "Untagged", deselect other tags; when selecting a tag, deselect "Untagged".
  const handleChange = React.useCallback(
    (newValue: string[]) => {
      // No conflict: cleared, single selection, or no "Untagged" in the mix
      if (!Array.isArray(newValue) || newValue.length <= 1 || !newValue.includes(UNTAGGED_VALUE)) {
        onChange(newValue);
        return;
      }

      // Conflict: newValue has both "Untagged" and real tags — keep whichever was just added
      const hadUntagged = Array.isArray(value) && value.includes(UNTAGGED_VALUE);
      onChange(hadUntagged ? newValue.filter(v => v !== UNTAGGED_VALUE) : [UNTAGGED_VALUE]);
    },
    [onChange, value],
  );

  return (
    <ComboSelectFilter
      isMulti
      options={displayOptions}
      loading={loading}
      creatable
      searchFunc={searchFunc}
      onInputChange={v => setIsSearching(Boolean(v))}
      {...props}
      onChange={handleChange}
    />
  );
}
