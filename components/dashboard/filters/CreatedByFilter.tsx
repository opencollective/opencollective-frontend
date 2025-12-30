import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';
import type { AccountHoverCardFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import ComboSelectFilter from './ComboSelectFilter';
import { AccountRenderer } from './HostedAccountFilter';

type FilterMeta = {
  createdByUsers?: Partial<AccountHoverCardFieldsFragment>[];
};

const schema = isMulti(z.string()).optional();

const resultNodeToOption = (account: Partial<AccountHoverCardFieldsFragment>) => ({
  label: <AccountRenderer account={account as AccountHoverCardFieldsFragment & { slug: string }} inOptionsList />,
  keywords: [account.name],
  value: account.slug,
});

function CreatedByFilter({ meta, ...props }: FilterComponentProps<z.infer<typeof schema>, FilterMeta>) {
  const options = React.useMemo(() => meta?.createdByUsers?.map(resultNodeToOption) || [], [meta?.createdByUsers]);

  return <ComboSelectFilter options={options} isMulti {...props} />;
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
