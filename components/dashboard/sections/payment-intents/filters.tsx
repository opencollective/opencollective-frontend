import React from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { isMulti, limit, offset } from '../../../../lib/filters/schemas';
import type { AccountPaymentIntentsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import {
  PaymentIntentDirection,
  PaymentIntentStatus,
  PaymentIntentType,
} from '../../../../lib/graphql/types/v2/graphql';
import { i18nPaymentIntentStatus, i18nPaymentIntentType } from '../../../../lib/i18n/payment-intent';
import { sortSelectOptions } from '../../../../lib/utils';

import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';

const directionMessages = defineMessages({
  [PaymentIntentDirection.INCOMING]: { defaultMessage: 'Incoming', id: 'PaymentIntent.Direction.Incoming' },
  [PaymentIntentDirection.OUTGOING]: { defaultMessage: 'Outgoing', id: 'PaymentIntent.Direction.Outgoing' },
});

export const schema = z.object({
  limit: limit.default(20),
  offset,
  date: dateFilter.schema,
  status: isMulti(z.nativeEnum(PaymentIntentStatus)).optional(),
  type: isMulti(z.nativeEnum(PaymentIntentType)).optional(),
  direction: z.nativeEnum(PaymentIntentDirection).optional(),
  openPaymentIntentId: z.string().optional(),
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = {
  accountSlug?: string;
};

export const toVariables: FiltersToVariables<FilterValues, AccountPaymentIntentsQueryVariables, FilterMeta> = {
  date: value => dateToVariables(value, 'date'),
  // UI-only: tracks which drawer is open. Map to no query variable so opening/closing the drawer
  // doesn't change the list variables (which would force a refetch and blink the table).
  openPaymentIntentId: () => ({}),
};

export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  date: dateFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(PaymentIntentStatus)
          .map(value => ({ label: i18nPaymentIntentStatus(intl, value), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nPaymentIntentStatus(intl, value),
  },
  type: {
    labelMsg: defineMessage({ defaultMessage: 'Type', id: '+U6ozc' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(PaymentIntentType)
          .map(value => ({ label: i18nPaymentIntentType(intl, value), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nPaymentIntentType(intl, value),
  },
  direction: {
    labelMsg: defineMessage({ defaultMessage: 'Direction', id: 'DZ2Koj' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(PaymentIntentDirection).map(value => ({
          label: intl.formatMessage(directionMessages[value]),
          value,
        }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => intl.formatMessage(directionMessages[value]),
  },
};
