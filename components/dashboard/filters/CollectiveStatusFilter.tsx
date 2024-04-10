import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';

import ComboSelectFilter from './ComboSelectFilter';

export enum COLLECTIVE_STATUS {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  UNHOSTED = 'UNHOSTED',
}

export const CollectiveStatusMessages = defineMessages({
  [COLLECTIVE_STATUS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [COLLECTIVE_STATUS.FROZEN]: {
    id: 'CollectiveStatus.Frozen',
    defaultMessage: 'Frozen',
  },
  [COLLECTIVE_STATUS.UNHOSTED]: {
    id: 'CollectiveStatus.Unhosted',
    defaultMessage: 'Unhosted',
  },
});

const schema = z.nativeEnum(COLLECTIVE_STATUS).optional();

type CollectiveStatusFilterValue = z.infer<typeof schema>;

export const collectiveStatusFilter: FilterConfig<CollectiveStatusFilterValue> = {
  schema,
  filter: {
    labelMsg: defineMessage({ id: 'Status', defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () => [
          {
            label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.ACTIVE]),
            value: COLLECTIVE_STATUS.ACTIVE,
          },
          {
            label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.FROZEN]),
            value: COLLECTIVE_STATUS.FROZEN,
          },
          {
            label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.UNHOSTED]),
            value: COLLECTIVE_STATUS.UNHOSTED,
          },
        ],
        [intl],
      );
      return <ComboSelectFilter options={options} {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(CollectiveStatusMessages[value]),
  },
  toVariables: (value, key) => {
    if (key === 'status') {
      switch (value) {
        case COLLECTIVE_STATUS.ACTIVE:
          return { isFrozen: false, isUnhosted: false };
        case COLLECTIVE_STATUS.FROZEN:
          return { isFrozen: true, isUnhosted: false };
        case COLLECTIVE_STATUS.UNHOSTED:
          return { isUnhosted: true };
      }
    }
    return {};
  },
};
