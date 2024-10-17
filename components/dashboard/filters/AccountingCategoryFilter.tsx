import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';

import { getCategoryLabel } from '../../AccountingCategorySelect';

import ComboSelectFilter from './ComboSelectFilter';

const accountingCategoriesQuery = gql`
  query AccountingCategories($hostSlug: String) {
    host(slug: $hostSlug) {
      id
      accountingCategories {
        nodes {
          id
          code
          name
          kind
          appliesTo
        }
      }
    }
  }
`;

const schema = isMulti(z.string()).optional();

export const UNCATEGORIZED_VALUE = '__uncategorized__';

export const accountingCategoryFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Accounting Category', id: 'ckcrQ7' }),
    Component: AccountingCategoryFilter,
    valueRenderer({ value, intl }) {
      if (value === UNCATEGORIZED_VALUE) {
        return intl.formatMessage({ defaultMessage: 'Uncategorized', id: 'iO050q' });
      }

      return value;
    },
  },
};

function AccountingCategoryFilter({
  meta: { hostSlug, includeUncategorized },
  intl,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, { hostSlug: string; includeUncategorized?: boolean }>) {
  const { data, loading } = useQuery(accountingCategoriesQuery, { variables: { hostSlug }, context: API_V2_CONTEXT });

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
  }, [data, intl]);

  return <ComboSelectFilter isMulti options={options} loading={loading} {...props} />;
}
