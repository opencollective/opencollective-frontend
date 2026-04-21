/* 
  Copy/adaptation of ../PeriodCompareFilter to remove comparison period, time unit for time series, and not using UTC time periods (currently required for the time series data) 
  TODO: Deduplicate shared code.
*/

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { clsx } from 'clsx';
import type { Dayjs } from 'dayjs';
import { isEqual, omit } from 'lodash';
import { ArrowRight, CalendarIcon, ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import { getDayjsIsoUnit, getDayjsOpUnit } from '../../../../lib/date-utils';
import dayjs from '../../../../lib/dayjs';
import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { TimeUnit } from '../../../../lib/graphql/types/v2/graphql';
import { i18nPeriodFilterType } from '../../../../lib/i18n/period-compare-filter';

import { Button } from '../../../ui/Button';
import { Calendar } from '../../../ui/Calendar';
import { Input } from '../../../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/Popover';
import { Select, SelectContent, SelectItem, SelectValue } from '../../../ui/Select';

import { PeriodFilterType, schema } from './schema';

type PeriodCompareFilterValueType = z.infer<typeof schema>;

function getClosestPeriodStart(date: Dayjs, timeUnit: TimeUnit) {
  const currentPeriodStart = date.startOf(getDayjsIsoUnit(timeUnit));
  const nextPeriodStart = currentPeriodStart.add(1, getDayjsOpUnit(timeUnit));

  return Math.abs(date.diff(currentPeriodStart)) < Math.abs(date.diff(nextPeriodStart))
    ? currentPeriodStart
    : nextPeriodStart;
}

function formatShortDate(inputDate) {
  const date = dayjs(inputDate);
  const currentYear = dayjs().year();
  const dateYear = date.year();

  if (dateYear === currentYear) {
    // Format as "MMM D" for the current year
    return date.format('MMM D');
  } else {
    // Include year for previous years
    return date.format('MMM D, YYYY');
  }
}

function formatPeriod({ from, to }): string {
  if (!from || !to) {
    return '';
  }
  const formattedFrom = formatShortDate(from);
  const formattedTo = formatShortDate(to);

  // If both dates are set, and they are the same, only show one date
  if (formattedFrom === formattedTo) {
    return formattedFrom;
  }

  return `${formattedFrom} – ${formattedTo}`;
}

const dateToSimpleDateString = (date: Date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

function getPeriodDates(value: PeriodCompareFilterValueType): {
  dateFrom?: Dayjs;
  dateTo?: Dayjs;
} {
  if (value.type === PeriodFilterType.ALL_TIME) {
    return { dateFrom: undefined, dateTo: undefined };
  }

  const now = dayjs();
  let dateTo = now.endOf('day');
  let dateFrom;

  switch (value.type) {
    case PeriodFilterType.TODAY:
      dateFrom = now.startOf('day');
      break;
    case PeriodFilterType.LAST_7_DAYS:
      dateFrom = now.endOf('day').subtract(7, 'day');
      break;
    case PeriodFilterType.LAST_4_WEEKS:
      dateFrom = now.endOf('day').subtract(4, 'weeks');
      break;
    case PeriodFilterType.LAST_3_MONTHS:
      dateFrom = now.endOf('day').subtract(3, 'months');
      break;
    case PeriodFilterType.LAST_12_MONTHS:
      dateFrom = now.endOf('day').subtract(12, 'months');
      break;
    case PeriodFilterType.MONTH_TO_DATE:
      dateFrom = now.startOf('month');
      break;
    case PeriodFilterType.QUARTER_TO_DATE:
      dateFrom = now.startOf('quarter');
      break;
    case PeriodFilterType.YEAR_TO_DATE:
      dateFrom = now.startOf('year');
      break;
  }
  if (value.gte) {
    dateFrom = dayjs(value.gte).startOf('day');
  }
  if (value.lte) {
    dateTo = dayjs(value.lte).endOf('day');
  }

  // Adjust dateFrom to closest period start
  dateFrom = getClosestPeriodStart(dateFrom, TimeUnit.DAY);

  return { dateFrom, dateTo };
}

const PeriodFilter = ({
  value,
  onChange,
}: {
  value: PeriodCompareFilterValueType;
  onChange: (val: PeriodCompareFilterValueType) => void;
}) => {
  const intl = useIntl();
  const [rangeSelectorOpen, setRangeSelectorOpen] = React.useState(false);
  const dateVariables = getPeriodDates(value);
  const showRangeSelector = value.type !== PeriodFilterType.ALL_TIME;
  return (
    <React.Fragment>
      <div className="flex items-center overflow-hidden">
        <Select
          value={value.type}
          onValueChange={(type: PeriodFilterType) => value.type !== type && onChange({ type })}
        >
          <SelectPrimitive.Trigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={clsx(
                'min-w-36 justify-between gap-0.5 truncate rounded-full pl-3 text-left',
                showRangeSelector && 'rounded-r-none',
              )}
            >
              <SelectValue />
              <ChevronDown size={16} className="text-muted-foreground" />
            </Button>
          </SelectPrimitive.Trigger>
          <SelectContent className="max-w-52" align="center">
            <div className="flex flex-col">
              {Object.values(
                value.type !== PeriodFilterType.CUSTOM
                  ? omit(PeriodFilterType, PeriodFilterType.CUSTOM)
                  : PeriodFilterType,
              ).map(type => (
                <SelectItem key={type} value={type}>
                  <span>{intl.formatMessage(i18nPeriodFilterType[type])}</span>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>

        {showRangeSelector && (
          <Popover open={rangeSelectorOpen} onOpenChange={setRangeSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 overflow-hidden rounded-full rounded-l-none border-l-0 pr-3"
              >
                <CalendarIcon size={16} className="text-muted-foreground" />{' '}
                <span className="truncate">
                  {formatPeriod({ from: dateVariables.dateFrom, to: dateVariables.dateTo })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-80 p-0 text-sm">
              <RangeSelector
                value={value}
                onChange={val => {
                  onChange(val);
                  setRangeSelectorOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </React.Fragment>
  );
};

function RangeSelector({
  value,
  onChange,
}: {
  value: PeriodCompareFilterValueType;
  onChange: (val: PeriodCompareFilterValueType) => void;
}) {
  const dateVariables = getPeriodDates(value);
  const initialValues = {
    ...value,
    gte: dateVariables.dateFrom.format('YYYY-MM-DD'),
    lte: dateVariables.dateTo.format('YYYY-MM-DD'),
  };
  const [tmpValue, setTmpValue] = React.useState(initialValues);
  const hasChanged = !isEqual(tmpValue, initialValues);
  const { success } = schema.safeParse(tmpValue);
  const canApply = hasChanged && success;
  const onApply = () => {
    onChange(tmpValue);
  };

  const dateRange = {
    from: dayjs(tmpValue.gte),
    to: dayjs(tmpValue.lte),
  };

  return (
    <React.Fragment>
      <div className="flex items-center justify-center gap-1 border-b p-3">
        <Input
          className="h-9 px-2 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          type="date"
          value={tmpValue.gte}
          onChange={e => setTmpValue({ ...tmpValue, type: PeriodFilterType.CUSTOM, gte: e.target.value })}
        />
        <ArrowRight size={14} className="shrink-0" />
        <Input
          className="h-9 px-2 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          type="date"
          value={tmpValue.lte}
          onChange={e => setTmpValue({ ...tmpValue, type: PeriodFilterType.CUSTOM, lte: e.target.value })}
        />
      </div>
      <div className="flex justify-center">
        <Calendar
          weekStartsOn={1}
          mode="range"
          defaultMonth={dateVariables.dateFrom.toDate()}
          selected={{
            from: dateRange.from.isValid() ? dateRange.from.toDate() : undefined,
            to: dateRange.to.isValid() ? dateRange.to.toDate() : undefined,
          }}
          onSelect={range => {
            setTmpValue({
              type: PeriodFilterType.CUSTOM,
              gte: range?.from ? dateToSimpleDateString(range.from) : undefined,
              lte: range?.to ? dateToSimpleDateString(range.to) : undefined,
            });
          }}
          numberOfMonths={1}
          timeZone="UTC"
        />
      </div>
      <div className="border-t p-3">
        <Button onClick={onApply} className="w-full" disabled={!canApply}>
          <FormattedMessage id="Apply" defaultMessage="Apply" />
        </Button>
      </div>
    </React.Fragment>
  );
}

function toVariables(value: PeriodCompareFilterValueType) {
  const { dateFrom, dateTo } = getPeriodDates(value);

  const dateFromIso = dateFrom?.toISOString();
  const dateToIso = dateTo?.toISOString();
  return {
    dateFrom: dateFromIso,
    dateTo: dateToIso === dayjs().endOf('day').toISOString() ? undefined : dateTo?.toISOString(),
  };
}

export const periodFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables,
  filter: {
    static: true,
    StandaloneComponent: PeriodFilter,
  },
};
