import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { isMulti, limit, offset } from '../../../../lib/filters/schemas';
import type { HostPaymentIntentsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { PaymentIntentStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nPaymentIntentStatus } from '../../../../lib/i18n/payment-intent';
import { sortSelectOptions } from '../../../../lib/utils';

import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { hostContextFilter } from '../../filters/HostContextFilter';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';

export const schema = z.object({
  limit: limit.default(20),
  offset,
  hostContext: hostContextFilter.schema,
  account: hostedAccountFilter.schema,
  date: dateFilter.schema,
  status: isMulti(z.nativeEnum(PaymentIntentStatus)).optional(),
  openPaymentIntentId: z.string().optional(),
});

export type FilterValues = z.infer<typeof schema>;

export type FilterMeta = {
  hostSlug: string;
};

export const toVariables: FiltersToVariables<FilterValues, HostPaymentIntentsQueryVariables, FilterMeta> = {
  hostContext: value => ({ hostContext: value }),
  account: hostedAccountFilter.toVariables,
  date: value => dateToVariables(value, 'date'),
};

export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  account: hostedAccountFilter.filter,
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
};
