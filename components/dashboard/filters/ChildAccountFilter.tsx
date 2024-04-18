import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { Account } from '../../../lib/graphql/types/v2/graphql';

import ComboSelectFilter from './ComboSelectFilter';
import { AccountRenderer } from './HostedAccountFilter';

const schema = z.string().nullable().default(null);

function ChildAccountFilter({
  meta,
  intl,
  ...props
}: FilterComponentProps<z.infer<typeof schema>, { accountSlug: string; childrenAccounts?: Account[] }>) {
  const groupedOptions = React.useMemo(
    () => [
      {
        label: intl.formatMessage({ defaultMessage: 'Main account', id: 'pE0V//' }),
        options: [
          {
            value: meta.accountSlug,
            label: <AccountRenderer account={{ slug: meta.accountSlug }} inOptionsList />,
          },
        ],
      },
      {
        label: intl.formatMessage({ id: 'Projects', defaultMessage: 'Projects' }),
        options: meta.childrenAccounts
          .filter(a => a.type === 'PROJECT')
          .map(account => ({
            value: account.slug,
            keywords: [account.name],
            label: <AccountRenderer account={account} inOptionsList />,
          })),
      },
      {
        label: intl.formatMessage({ id: 'Events', defaultMessage: 'Events' }),
        options: meta.childrenAccounts
          .filter(a => a.type === 'EVENT')
          .map(account => ({
            value: account.slug,
            keywords: [account.name],
            label: <AccountRenderer account={account} inOptionsList />,
          })),
      },
    ],
    [meta.accountSlug, meta.childrenAccounts, intl],
  );

  return <ComboSelectFilter groupedOptions={groupedOptions} {...props} />;
}

export const childAccountFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildren: false };
    } else if (!value) {
      return { includeChildren: true };
    } else {
      return { slug: value, includeChildren: false };
    }
  },
  filter: {
    static: true,
    hide: ({ meta }) => !meta?.childrenAccounts || meta.childrenAccounts.length === 0,
    labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    Component: ChildAccountFilter,
    valueRenderer: ({ value }) => <AccountRenderer account={{ slug: value }} />,
  },
};
