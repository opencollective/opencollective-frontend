import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import clsx from 'clsx';
import type { Dayjs, OpUnitType, UnitType } from 'dayjs';
import { isEqual, omit } from 'lodash';
import { ArrowRight, CalendarIcon, ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import dayjs from '../../../../lib/dayjs';
import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { TimeUnit } from '../../../../lib/graphql/types/v2/graphql';
import {
  i18nPeriodFilterCompare,
  i18nPeriodFilterType,
  i18nTimeUnit,
} from '../../../../lib/i18n/period-compare-filter';

import { Button } from '../../../ui/Button';
import { Calendar } from '../../../ui/Calendar';
import { Input } from '../../../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/Popover';
import { Select, SelectContent, SelectItem, SelectValue } from '../../../ui/Select';

import { PeriodFilterCompare, PeriodFilterType, schema } from './schema';

export type PeriodCompareFilterValueType = z.infer<typeof schema>;

export const getDayjsIsoUnit = (timeUnit: TimeUnit): OpUnitType | 'isoWeek' => {
  // Use "isoWeek" to have the week start on Monday, in accordance with the behavior from the API returning time series data
  // Note: "isoWeek" should only be used when finding the startOf or endOf a period, for regular adding and subtracting, "week" should be used.
  if (timeUnit === TimeUnit.WEEK) {
    return 'isoWeek';
  }
  return timeUnit.toLowerCase() as OpUnitType;
};

const getDayjsOpUnit = (timeUnit: TimeUnit): UnitType => {
  return timeUnit.toLowerCase() as UnitType;
};

const getAvailableTimeUnits = (value: PeriodCompareFilterValueType): TimeUnit[] => {
  const { dateTo, dateFrom } = getPeriodDates(value);
  let startDate = dateFrom;
  let endDate = dateTo;
  // All options (a subset of TimeUnit)
  const timeUnits = [TimeUnit.HOUR, TimeUnit.DAY, TimeUnit.WEEK, TimeUnit.MONTH, TimeUnit.YEAR];

  if (!dateFrom) {
    startDate = dayjs.utc('2016-01-01');
  }
  if (!dateTo) {
    endDate = dayjs.utc();
  }

  // Return all time units that have a period of at least 2 and at most 400 units
  const availableUnits = timeUnits.reduce((acc, unit) => {
    const periods = endDate.diff(startDate, getDayjsOpUnit(unit)) + 1;
    if (periods >= 2 && periods <= 400) {
      acc.push(unit);
    }
    return acc;
  }, []);

  return availableUnits;
};

function getClosestPeriodStart(date: Dayjs, timeUnit: TimeUnit) {
  const currentPeriodStart = date.startOf(getDayjsIsoUnit(timeUnit));
  const nextPeriodStart = currentPeriodStart.add(1, getDayjsOpUnit(timeUnit));

  return Math.abs(date.diff(currentPeriodStart)) < Math.abs(date.diff(nextPeriodStart))
    ? currentPeriodStart
    : nextPeriodStart;
}

function formatShortDate(inputDate) {
  const date = dayjs.utc(inputDate);
  const currentYear = dayjs.utc().year();
  const dateYear = date.year();

  if (dateYear === currentYear) {
    // Format as "MMM D" for the current year
    return date.format('MMM D');
  } else {
    // Include year for previous years
    return date.format('MMM D, YYYY');
  }
}

export function formatPeriod({ from, to }): string {
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
  return dayjs.utc(date).format('YYYY-MM-DD');
};

function getPeriodDates(value: PeriodCompareFilterValueType): {
  dateFrom?: Dayjs;
  dateTo?: Dayjs;
  compareFrom?: Dayjs;
  compareTo?: Dayjs;
} {
  if (value.type === PeriodFilterType.ALL_TIME) {
    return { dateFrom: undefined, dateTo: undefined };
  }
  const IsoTimeUnit = getDayjsIsoUnit(value.timeUnit);
  const OpTimeUnit = getDayjsOpUnit(value.timeUnit);

  const now = dayjs.utc();
  let dateTo = now.endOf('day');
  let dateFrom;

  switch (value.type) {
    case PeriodFilterType.TODAY:
      dateFrom = now.startOf('day');
      break;
    case PeriodFilterType.LAST_7_DAYS:
      dateFrom = now.endOf(IsoTimeUnit).subtract(7, 'day');
      break;
    case PeriodFilterType.LAST_4_WEEKS:
      dateFrom = now.endOf(IsoTimeUnit).subtract(4, 'weeks');
      break;
    case PeriodFilterType.LAST_3_MONTHS:
      dateFrom = now.endOf(IsoTimeUnit).subtract(3, 'months');
      break;
    case PeriodFilterType.LAST_12_MONTHS:
      dateFrom = now.endOf(IsoTimeUnit).subtract(12, 'months');
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
    dateFrom = dayjs.utc(value.gte).startOf(IsoTimeUnit);
  }
  if (value.lte) {
    dateTo = dayjs.utc(value.lte).endOf(IsoTimeUnit);
  }

  // Adjust dateFrom to closest period start
  dateFrom = getClosestPeriodStart(dateFrom, value.timeUnit);

  let compareFrom, compareTo;

  const periodLength = dateTo.diff(dateFrom, OpTimeUnit);

  switch (value.compare) {
    case PeriodFilterCompare.PREVIOUS_PERIOD:
      compareFrom = dateFrom.subtract(periodLength + 1, OpTimeUnit);
      compareTo = dateTo.subtract(periodLength + 1, OpTimeUnit);
      break;
    case PeriodFilterCompare.PREVIOUS_MONTH:
      compareFrom = dateFrom.subtract(1, 'month');
      compareTo = dateTo.subtract(1, 'month');
      break;
    case PeriodFilterCompare.PREVIOUS_QUARTER:
      compareFrom = dateFrom.subtract(1, 'quarter');
      compareTo = dateTo.subtract(1, 'quarter');
      break;
    case PeriodFilterCompare.PREVIOUS_YEAR:
      compareFrom = dateFrom.subtract(1, 'year');
      compareTo = dateTo.subtract(1, 'year');
      break;
  }

  return { dateFrom, dateTo, compareFrom, compareTo };
}

const PeriodCompareFilter = ({
  value,
  onChange,
}: {
  value: PeriodCompareFilterValueType;
  onChange: (val: PeriodCompareFilterValueType) => void;
}) => {
  const intl = useIntl();
  const [rangeSelectorOpen, setRangeSelectorOpen] = React.useState(false);
  const dateVariables = getPeriodDates(value);
  const availableTimeUnitOptions = getAvailableTimeUnits(value);
  const showRangeSelector = value.type !== PeriodFilterType.ALL_TIME;
  return (
    <React.Fragment>
      <div className="flex items-center">
        <Select
          value={value.type}
          onValueChange={(type: PeriodFilterType) => value.type !== type && onChange({ type })}
        >
          <SelectPrimitive.Trigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={clsx(
                'min-w-36 justify-between gap-0.5 rounded-full pl-3 text-left',
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
              <Button size="sm" variant="outline" className="gap-2 rounded-full rounded-l-none border-l-0 pr-3">
                <CalendarIcon size={16} className="text-muted-foreground" />{' '}
                <span>{formatPeriod({ from: dateVariables.dateFrom, to: dateVariables.dateTo })}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[280px] p-0 text-sm">
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
      {value.type !== PeriodFilterType.ALL_TIME && (
        <React.Fragment>
          <span className="text-sm text-muted-foreground">
            <FormattedMessage id="PeriodCompareFilter.comparedTo" defaultMessage="compared to" />
          </span>

          <Select
            value={value.compare}
            onValueChange={(compare: PeriodFilterCompare) => onChange({ ...value, compare })}
          >
            <SelectPrimitive.Trigger asChild>
              <Button size="sm" variant="outline" className="gap-1 rounded-full">
                <span>{intl.formatMessage(i18nPeriodFilterCompare[value.compare])}</span>

                <ChevronDown size={16} className="text-muted-foreground" />
              </Button>
            </SelectPrimitive.Trigger>
            <SelectContent align="center">
              <div className="flex flex-col">
                {Object.values(PeriodFilterCompare).map(type => {
                  const dateVariables = toVariables({ ...value, compare: type });
                  return (
                    <SelectItem key={type} value={type} className="justify-stretch" asChild>
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <div>{intl.formatMessage(i18nPeriodFilterCompare[type])}</div>{' '}
                        <div className="text-muted-foreground">
                          {formatPeriod({ from: dateVariables.compareFrom, to: dateVariables.compareTo })}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </SelectContent>
          </Select>
        </React.Fragment>
      )}
      <Select
        value={value.timeUnit}
        onValueChange={(timeUnit: TimeUnit) => value.timeUnit !== timeUnit && onChange({ ...value, timeUnit })}
      >
        <SelectPrimitive.Trigger asChild>
          <Button size="sm" variant="outline" className="justify-between gap-0.5 rounded-full text-left">
            <SelectValue />
            <ChevronDown size={16} className="text-muted-foreground" />
          </Button>
        </SelectPrimitive.Trigger>
        <SelectContent className="max-w-52" align="center">
          <div className="flex flex-col">
            {availableTimeUnitOptions.map(timeUnit => (
              <SelectItem key={timeUnit} value={timeUnit}>
                <span>{intl.formatMessage(i18nTimeUnit[timeUnit])}</span>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
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
    from: dayjs.utc(tmpValue.gte),
    to: dayjs.utc(tmpValue.lte),
  };

  return (
    <React.Fragment>
      <div className="flex items-center justify-center gap-2 border-b p-3">
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
          onSelect={({ from, to }) => {
            setTmpValue({
              type: PeriodFilterType.CUSTOM,
              gte: from ? dateToSimpleDateString(from) : undefined,
              lte: to ? dateToSimpleDateString(to) : undefined,
            });
          }}
          numberOfMonths={1}
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
  const { dateFrom, dateTo, compareFrom, compareTo } = getPeriodDates(value);

  return {
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
    compareFrom: compareFrom?.toISOString(),
    compareTo: compareTo?.toISOString(),
    includeComparison: Boolean(compareFrom && compareTo),
    timeUnit: value.timeUnit,
  };
}

export const periodCompareFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  toVariables,
  filter: {
    static: true,
    StandaloneComponent: PeriodCompareFilter,
  },
};
