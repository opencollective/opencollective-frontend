import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { gql } from '../../../lib/graphql/helpers';
import type { AccountingCategoryKind } from '@/lib/graphql/types/v2/schema';

import { accountingCategorySelectFieldsFragment, getCategoryLabel } from '../../AccountingCategorySelect';

import ComboSelectFilter from './ComboSelectFilter';

const accountingCategoriesQuery = gql`
  query AccountingCategories($hostSlug: String, $kind: [AccountingCategoryKind!]) {
    host(slug: $hostSlug) {
      id
      accountingCategories(kind: $kind) {
        nodes {
          ...AccountingCategorySelectFields
        }
      }
    }
  }
  ${accountingCategorySelectFieldsFragment}
`;

const schema = isMulti(z.string()).optional();

export const UNCATEGORIZED_VALUE = '__uncategorized__';

export const accountingCategoryFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Accounting Category', id: 'ckcrQ7' }),
    Component: AccountingCategoryFilter,
    hide: ({ meta }) => !meta?.hostSlug,
    valueRenderer({ value, intl }) {
      if (value === UNCATEGORIZED_VALUE) {
        return intl.formatMessage({ defaultMessage: 'Uncategorized', id: 'iO050q' });
      }

      return value;
    },
  },
};

function AccountingCategoryFilter({
  meta: { hostSlug, includeUncategorized, accountingCategoryKinds },
  intl,
  ...props
}: FilterComponentProps<
  z.infer<typeof schema>,
  { hostSlug?: string; includeUncategorized?: boolean; accountingCategoryKinds?: readonly AccountingCategoryKind[] }
>) {
  const { data, loading } = useQuery(accountingCategoriesQuery, {
    variables: { hostSlug, kind: accountingCategoryKinds },

    skip: !hostSlug,
  });

  const options = React.useMemo(() => {
    const categories = data?.host.accountingCategories.nodes.map(category => ({
      label: getCategoryLabel(intl, category, true),
      value: category.code,
      keywords: [category.name, category.friendlyName].filter(Boolean),
    }));

    if (includeUncategorized) {
      categories?.unshift({
        label: intl.formatMessage({ defaultMessage: 'Uncategorized', id: 'iO050q' }),
        value: UNCATEGORIZED_VALUE,
      });
    }

    return categories;
  }, [data, intl, includeUncategorized]);

  return <ComboSelectFilter isMulti options={options} loading={loading} {...props} />;
}
