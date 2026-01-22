import React from 'react';
import { pick } from 'lodash';
import { defineMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';
import { i18nAmountFilterLabel } from '../../../lib/i18n/amount-filter';
import type { Currency } from '@/lib/graphql/types/v2/schema';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';

import { AmountFilterValue } from './AmountFilter/AmountFilterValue';
import type { AmountFilterValueType } from './AmountFilter/schema';
import { amountFilterSchema, AmountFilterType } from './AmountFilter/schema';
import { renderOptions } from './AmountFilter';

const BalanceFilterType = pick(AmountFilterType, ['IS_GREATER_THAN', 'IS_LESS_THAN', 'IS_BETWEEN']);

// eslint-disable-next-line prefer-arrow-callback
const BalanceFilter = React.memo(function BalanceFilter({
  value,
  onChange,
  meta,
}: {
  value: AmountFilterValueType;
  onChange: (value: AmountFilterValueType) => void;
  meta?: { currency?: Currency };
}) {
  const intl = useIntl();
  value = value ?? { type: AmountFilterType.IS_GREATER_THAN, currency: meta?.currency };

  return (
    <div className="flex flex-col gap-2 p-3">
      <Select defaultValue={value.type} onValueChange={(type: AmountFilterType) => onChange({ type })}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={e => {
            e.preventDefault();
          }}
        >
          {Object.values(BalanceFilterType).map(type => (
            <SelectItem key={type} value={type}>
              {i18nAmountFilterLabel(intl, type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderOptions(value, onChange, meta)}
    </div>
  );
});

export const consolidatedBalanceFilter: FilterConfig<z.infer<typeof amountFilterSchema>, { currency?: Currency }> = {
  schema: amountFilterSchema,
  toVariables: (value: z.infer<typeof amountFilterSchema>) => ({
    consolidatedBalance: {
      gte: 'gte' in value ? { valueInCents: value.gte, currency: value.currency || undefined } : undefined,
      lte: 'lte' in value ? { valueInCents: value.lte, currency: value.currency || undefined } : undefined,
    },
  }),
  filter: {
    Component: BalanceFilter,
    labelMsg: defineMessage({ id: 'Balance', defaultMessage: 'Balance' }),
    valueRenderer: ({ value, meta }) => <AmountFilterValue value={value} currency={meta.currency} />,
  },
};
