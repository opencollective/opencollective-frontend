import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { i18nDateFilterLabel, i18nDatePeriodLabel } from '../../../../lib/i18n/date-filter';

import { Input } from '../../../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import { DateFilterValue } from './DateFilterValue';
import { DateInput } from './DateInput';
import { DateRangeInput } from './DateRangeInput';
import type { DateFilterValueType } from './schema';
import { dateFilterSchema, DateFilterType, dateToVariables, Period } from './schema';
import { Timezonepicker } from './TimezonePicker';

export const dateFilter: FilterConfig<z.infer<typeof dateFilterSchema>> = {
  schema: dateFilterSchema,
  toVariables: dateToVariables,
  filter: {
    labelMsg: defineMessage({ id: 'expense.incurredAt', defaultMessage: 'Date' }),
    Component: DateFilter,
    valueRenderer: DateFilterValue,
  },
};

const renderOptions = (value: DateFilterValueType, setValue: (val: DateFilterValueType) => void, intl) => {
  switch (value.type) {
    case DateFilterType.IN_LAST_PERIOD:
      return (
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} className="ml-2 shrink-0 text-primary" />
          <Input
            autoFocus
            value={value.number}
            type="number"
            onChange={e => setValue({ ...value, number: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Select
            defaultValue={Period.DAYS}
            value={value?.period}
            onValueChange={(period: Period) => setValue({ ...value, period })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Period).map(period => (
                <SelectItem key={period} value={period}>
                  {i18nDatePeriodLabel(intl, period)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case DateFilterType.EQUAL_TO:
      return (
        <DateInput
          date={value.gte}
          onChange={date => setValue({ ...value, gte: date, lte: date })}
          autoFocus={!value.lte}
        />
      );
    case DateFilterType.AFTER:
      return <DateInput date={value.gt} onChange={date => setValue({ ...value, gt: date })} autoFocus={!value.gt} />;
    case DateFilterType.ON_OR_AFTER:
      return <DateInput date={value.gte} onChange={date => setValue({ ...value, gte: date })} autoFocus={!value.gte} />;
    case DateFilterType.BEFORE:
      return <DateInput date={value.lt} onChange={date => setValue({ ...value, lt: date })} autoFocus={!value.lt} />;
    case DateFilterType.BEFORE_OR_ON:
      return <DateInput date={value.lte} onChange={date => setValue({ ...value, lte: date })} autoFocus={!value.lte} />;
    case DateFilterType.BETWEEN:
      return (
        <DateRangeInput value={value} onChange={value => setValue({ ...value, lte: value.lte, gte: value.gte })} />
      );
    default:
      return null;
  }
};

function DateFilter({
  value,
  onChange,
}: {
  value?: DateFilterValueType;
  onChange: (value: DateFilterValueType) => void;
}) {
  const intl = useIntl();
  value = value ?? {
    type: DateFilterType.IN_LAST_PERIOD,
    period: Period.DAYS,
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <Select
        defaultValue={value.type}
        onValueChange={(type: DateFilterType) => {
          onChange({ ...value, type });
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
          {Object.values(DateFilterType).map(type => (
            <SelectItem key={type} value={type}>
              {i18nDateFilterLabel(intl, type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderOptions(value, onChange, intl)}
      <Timezonepicker value={value.tz} onChange={tz => onChange({ ...value, tz })} />
    </div>
  );
}
