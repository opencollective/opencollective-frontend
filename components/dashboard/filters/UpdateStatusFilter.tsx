import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';

import ComboSelectFilter from './ComboSelectFilter';

export enum UPDATE_STATUS {
  PUBLISHED = 'PUBLISHED',
  DRAFTED = 'DRAFTED',
}

const UpdateStatusMessages = defineMessages({
  [UPDATE_STATUS.PUBLISHED]: {
    id: 'update.status.published',
    defaultMessage: 'Published',
  },
  [UPDATE_STATUS.DRAFTED]: {
    id: 'update.status.drafted',
    defaultMessage: 'Drafted',
  },
});

const schema = z.nativeEnum(UPDATE_STATUS).optional();

type UpdateStatusFilterValue = z.infer<typeof schema>;

export const updateStatusFilter: FilterConfig<UpdateStatusFilterValue> = {
  schema,
  filter: {
    labelMsg: defineMessage({ id: 'Status', defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () => [
          {
            label: intl.formatMessage(UpdateStatusMessages[UPDATE_STATUS.PUBLISHED]),
            value: UPDATE_STATUS.PUBLISHED,
          },
          {
            label: intl.formatMessage(UpdateStatusMessages[UPDATE_STATUS.DRAFTED]),
            value: UPDATE_STATUS.DRAFTED,
          },
        ],
        [intl],
      );
      return <ComboSelectFilter options={options} {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(UpdateStatusMessages[value]),
  },
  toVariables: value => {
    switch (value) {
      case UPDATE_STATUS.PUBLISHED:
        return { onlyPublishedUpdates: true };
      case UPDATE_STATUS.DRAFTED:
        return { isDraft: true };
    }
  },
};
