import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
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
        }
      }
    }
  }
`;

const schema = isMulti(z.string()).optional();

export const accountingCategoryFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Accounting Category', id: 'ckcrQ7' }),
    Component: AccountingCategoryFilter,
  },
};

function AccountingCategoryFilter({
  meta: { hostSlug },
  intl,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, { hostSlug: string }>) {
  const { data, loading } = useQuery(accountingCategoriesQuery, { variables: { hostSlug }, context: API_V2_CONTEXT });

  const options = React.useMemo(
    () =>
      data?.host.accountingCategories.nodes.map(category => ({
        label: getCategoryLabel(intl, category, true),
        value: category.code,
        keywords: [category.name, category.friendlyName].filter(Boolean),
      })),
    [data, intl],
  );

  return <ComboSelectFilter isMulti options={options} loading={loading} {...props} />;
}
