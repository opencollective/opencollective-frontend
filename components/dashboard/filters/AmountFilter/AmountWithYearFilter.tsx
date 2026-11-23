import React from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';

import type { FilterConfig } from '../../../../lib/filters/filter-types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import { AmountFilterValue } from './AmountFilterValue';
import { amountFilter, amountToVariables } from './index';
import type { AmountFilterValueType } from './schema';

const ALL_TIME = 'ALL_TIME';
const YEARS_COUNT = 10;

type AmountWithYearFilterValue = AmountFilterValueType;

/** The amount filter, with an additional (optional) year to restrict the amounts to */
const AmountWithYearFilter = ({
  value,
  onChange,
  meta,
}: {
  value: AmountWithYearFilterValue;
  onChange: (value: AmountWithYearFilterValue) => void;
  meta?: { currency?: string };
}) => {
  const intl = useIntl();
  // Kept locally because a year alone isn't a valid filter value (it needs an amount)
  const [year, setYear] = React.useState<number | undefined>(value?.year);
  const currentYear = new Date().getUTCFullYear();
  const years = React.useMemo(() => Array.from({ length: YEARS_COUNT }, (_, i) => currentYear - i), [currentYear]);
  const AmountComponent = amountFilter.filter.Component;

  return (
    <div className="flex flex-col">
      <AmountComponent
        value={value}
        intl={intl}
        meta={meta}
        onChange={newValue => onChange(newValue ? { ...newValue, year } : newValue)}
      />
      <div className="flex flex-col gap-1 px-3 pb-3">
        <span className="text-xs font-medium text-muted-foreground">
          <FormattedMessage defaultMessage="Year" id="IFo1oo" />
        </span>
        <Select
          value={year ? String(year) : ALL_TIME}
          onValueChange={newValue => {
            const newYear = newValue === ALL_TIME ? undefined : Number(newValue);
            setYear(newYear);
            if (value) {
              onChange({ ...value, year: newYear });
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onCloseAutoFocus={e => {
              e.preventDefault();
            }}
          >
            <SelectItem value={ALL_TIME}>
              <FormattedMessage defaultMessage="All time" id="s+lPP3" />
            </SelectItem>
            {years.map(optionYear => (
              <SelectItem key={optionYear} value={String(optionYear)}>
                {optionYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/**
 * Same as `makeAmountFilter`, but with an optional year. The variable is a `AmountRangeWithYearInput`,
 * only supported by the `community` query.
 */
export const makeAmountWithYearFilter = (
  variableKey: string,
  labelMsg: MessageDescriptor,
): FilterConfig<AmountFilterValueType> => ({
  ...amountFilter,
  toVariables: (value, key, meta) => ({
    [variableKey]: { ...amountToVariables(value, key, meta).amount, year: value?.year },
  }),
  filter: {
    labelMsg,
    Component: AmountWithYearFilter,
    valueRenderer: ({ value, meta }) => (
      <div className="flex items-center gap-1">
        <AmountFilterValue value={value} currency={meta?.currency} />
        {value.year && <span className="text-muted-foreground">· {value.year}</span>}
      </div>
    ),
  },
});
