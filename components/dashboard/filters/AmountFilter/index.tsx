import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { i18nAmountFilterLabel } from '../../../../lib/i18n/amount-filter';

import { Input } from '../../../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import { AmountFilterValue } from './AmountFilterValue';
import type { AmountFilterValueType } from './schema';
import { amountFilterSchema, AmountFilterType } from './schema';

function amountToVariables(value: z.infer<typeof amountFilterSchema>): {
  minAmount: undefined | number;
  maxAmount: undefined | number;
} {
  return {
    minAmount: 'gte' in value ? value.gte : undefined,
    maxAmount: 'lte' in value ? value.lte : undefined,
  };
}

const formatNumber = (str: string) => stringToCents.parse(str);
const toStr = (number?: number | null) => (number ? number / 100 : undefined);
const stringToCents = z.coerce
  .number()
  .transform(num => Math.round(num * 100))
  .pipe(z.number().int().min(0).catch(null));

const NumberInput = ({ value, onChangeValue, ...props }) => {
  return (
    <Input
      type="number"
      value={toStr(value)}
      onChange={e => onChangeValue(formatNumber(e.target.value))}
      step="0.01"
      {...props}
    />
  );
};

const renderOptions = (value: AmountFilterValueType, onChange: (tmpValue: AmountFilterValueType) => void) => {
  switch (value.type) {
    case AmountFilterType.IS_EQUAL_TO:
      return (
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
          <NumberInput value={value.gte} onChangeValue={gte => onChange({ ...value, gte, lte: gte })} autoFocus />
        </div>
      );
    case AmountFilterType.IS_GREATER_THAN:
      return (
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
          <NumberInput value={value.gte} onChangeValue={gte => onChange({ ...value, gte })} autoFocus />
        </div>
      );
    case AmountFilterType.IS_LESS_THAN:
      return (
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
          <NumberInput value={value.lte} onChangeValue={lte => onChange({ ...value, lte })} autoFocus />
        </div>
      );

    case AmountFilterType.IS_BETWEEN:
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
            <NumberInput value={value.gte} onChangeValue={gte => onChange({ ...value, gte })} autoFocus />
          </div>
          <div className="flex items-center gap-2">
            <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
            <NumberInput value={value.lte} onChangeValue={lte => onChange({ ...value, lte })} />
          </div>
        </div>
      );
    default:
      return null;
  }
};

// eslint-disable-next-line prefer-arrow-callback
const AmountFilter = React.memo(function AmountFilter({
  value,
  onChange,
}: {
  value: AmountFilterValueType;
  onChange: (value: AmountFilterValueType) => void;
}) {
  const intl = useIntl();
  value = value ?? { type: AmountFilterType.IS_EQUAL_TO };

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
          {Object.values(AmountFilterType).map(type => (
            <SelectItem key={type} value={type}>
              {i18nAmountFilterLabel(intl, type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderOptions(value, onChange)}
    </div>
  );
});

export const amountFilter: FilterConfig<z.infer<typeof amountFilterSchema>> = {
  schema: amountFilterSchema,
  toVariables: amountToVariables,
  filter: {
    labelMsg: defineMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
    Component: AmountFilter,
    valueRenderer: ({ value, meta }) => <AmountFilterValue value={value} currency={meta.currency} />,
  },
};
