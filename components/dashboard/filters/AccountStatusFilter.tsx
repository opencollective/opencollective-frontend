import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';

import ComboSelectFilter from './ComboSelectFilter';

export enum ACCOUNT_STATUS {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

const AccountStatusMessages = defineMessages({
  [ACCOUNT_STATUS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [ACCOUNT_STATUS.ARCHIVED]: {
    id: 'CollectiveStatus.Archived',
    defaultMessage: 'Archived',
  },
});

const schema = z.nativeEnum(ACCOUNT_STATUS).optional();

type AccountStatusFilterValue = z.infer<typeof schema>;

export const accountStatusFilter: FilterConfig<AccountStatusFilterValue> = {
  schema,
  filter: {
    labelMsg: defineMessage({ id: 'Status', defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () => [
          {
            label: intl.formatMessage(AccountStatusMessages[ACCOUNT_STATUS.ACTIVE]),
            value: ACCOUNT_STATUS.ACTIVE,
          },
          {
            label: intl.formatMessage(AccountStatusMessages[ACCOUNT_STATUS.ARCHIVED]),
            value: ACCOUNT_STATUS.ARCHIVED,
          },
        ],
        [intl],
      );
      return <ComboSelectFilter options={options} {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(AccountStatusMessages[value]),
  },
  toVariables: value => {
    switch (value) {
      case ACCOUNT_STATUS.ACTIVE:
        return { isActive: true };
      case ACCOUNT_STATUS.ARCHIVED:
        return { isActive: false };
    }
  },
};
