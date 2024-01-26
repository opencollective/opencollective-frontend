import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { omit } from 'lodash';
import { ArrowRight, CalendarIcon, ChevronDown } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../../lib/filters/filter-types';
import { SimpleDateString } from '../../../../lib/filters/schemas';

import { Button } from '../../../ui/Button';
import { Calendar } from '../../../ui/Calendar';
import { Input } from '../../../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/Popover';
import { Select, SelectContent, SelectItem, SelectValue } from '../../../ui/Select';

dayjs.extend(quarterOfYear);

enum PeriodFilterType {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_4_WEEKS = 'LAST_4_WEEKS',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_12_MONTHS = 'LAST_12_MONTHS',
  MONTH_TO_DATE = 'MONTH_TO_DATE',
  QUARTER_TO_DATE = 'QUARTER_TO_DATE',
  YEAR_TO_DATE = 'YEAR_TO_DATE',
  ALL_TIME = 'ALL_TIME',
  CUSTOM = 'CUSTOM',
}

enum PeriodFilterCompare {
  PREVIOUS_PERIOD = 'PREVIOUS_PERIOD',
  PREVIOUS_MONTH = 'PREVIOUS_MONTH',
  PREVIOUS_QUARTER = 'PREVIOUS_QUARTER',
  PREVIOUS_YEAR = 'PREVIOUS_YEAR',
  NO_COMPARISON = 'NO_COMPARISON',
}

const periodCompareSchema = z
  .object({
    type: z.nativeEnum(PeriodFilterType),
    gte: SimpleDateString.optional(),
    lte: SimpleDateString.optional(),
    compare: z.nativeEnum(PeriodFilterCompare).optional(),
  })
  .transform(value => {
    if (value.type === PeriodFilterType.ALL_TIME) {
      return { type: PeriodFilterType.ALL_TIME };
    }
    if (!value.compare) {
      if (value.type === PeriodFilterType.MONTH_TO_DATE) {
        return { ...value, compare: PeriodFilterCompare.PREVIOUS_MONTH };
      }
      if (value.type === PeriodFilterType.QUARTER_TO_DATE) {
        return { ...value, compare: PeriodFilterCompare.PREVIOUS_QUARTER };
      }
      if (value.type === PeriodFilterType.YEAR_TO_DATE) {
        return { ...value, compare: PeriodFilterCompare.PREVIOUS_YEAR };
      }
      return { ...value, compare: PeriodFilterCompare.PREVIOUS_PERIOD };
    }
    return value;
  })
  .default({ type: PeriodFilterType.LAST_4_WEEKS, compare: PeriodFilterCompare.PREVIOUS_PERIOD });

type PeriodCompareFilterValueType = z.infer<typeof periodCompareSchema>;

const i18nPeriodFilterCompare = defineMessages({
  [PeriodFilterCompare.PREVIOUS_PERIOD]: {
    defaultMessage: 'Previous period',
  },
  [PeriodFilterCompare.PREVIOUS_MONTH]: {
    defaultMessage: 'Previous month',
  },
  [PeriodFilterCompare.PREVIOUS_QUARTER]: {
    defaultMessage: 'Previous quarter',
  },
  [PeriodFilterCompare.PREVIOUS_YEAR]: {
    defaultMessage: 'Previous year',
  },
  [PeriodFilterCompare.NO_COMPARISON]: {
    defaultMessage: 'No comparison',
  },
});
const i18nPeriodFilterType = defineMessages({
  [PeriodFilterType.TODAY]: {
    defaultMessage: 'Today',
  },
  [PeriodFilterType.LAST_7_DAYS]: {
    defaultMessage: 'Last 7 days',
  },
  [PeriodFilterType.LAST_4_WEEKS]: {
    defaultMessage: 'Last 4 weeks',
  },
  [PeriodFilterType.LAST_3_MONTHS]: {
    defaultMessage: 'Last 3 months',
  },
  [PeriodFilterType.LAST_12_MONTHS]: {
    defaultMessage: 'Last 12 months',
  },
  [PeriodFilterType.MONTH_TO_DATE]: {
    defaultMessage: 'Month to date',
  },
  [PeriodFilterType.QUARTER_TO_DATE]: {
    defaultMessage: 'Quarter to date',
  },
  [PeriodFilterType.YEAR_TO_DATE]: {
    defaultMessage: 'Year to date',
  },
  [PeriodFilterType.ALL_TIME]: {
    defaultMessage: 'All time',
  },
  [PeriodFilterType.CUSTOM]: {
    defaultMessage: 'Custom',
  },
});

const PeriodCompareFilter = ({
  value,
  onChange,
}: {
  value: PeriodCompareFilterValueType;
  onChange: (val: PeriodCompareFilterValueType) => void;
}) => {
  const intl = useIntl();
  const dateVariables = toVariables(value);

  function formatDate(inputDate) {
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

  function formatPeriod({ from, to }) {
    if (!from && !to) {
      return '';
    }
    const formattedFrom = formatDate(from);
    const formattedTo = formatDate(to);

    // If both dates are set, and they are the same, only show one date
    if (from && to && formattedFrom === formattedTo) {
      return formattedFrom;
    }
    // TOOD: i18n
    return `${from ? `${formattedFrom} –` : 'Before'} ${to ? formattedTo : ''}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="flex items-center">
        <Select
          value={value.type}
          onValueChange={(type: PeriodFilterType) => value.type !== type && onChange({ type })}
        >
          <SelectPrimitive.Trigger asChild>
            <Button
              size="xs"
              variant="outline"
              className="min-w-36 justify-between gap-0.5  rounded-r-none text-left font-normal"
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

        <Popover>
          <PopoverTrigger asChild>
            <Button size="xs" variant="outline" className="gap-2  rounded-l-none border-l-0 font-normal">
              <CalendarIcon size={16} className="text-muted-foreground" />{' '}
              <span>{formatPeriod({ from: dateVariables.dateFrom, to: dateVariables.dateTo })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[280px] p-0 text-sm">
            <RangeSelector value={value} onChange={onChange} />
          </PopoverContent>
        </Popover>
      </div>
      {value.type !== PeriodFilterType.ALL_TIME && (
        <React.Fragment>
          <span className="text-muted-foreground">
            <FormattedMessage id="PeriodCompareFilter.comparedTo" defaultMessage="compared to" />
          </span>

          <Select
            value={value.compare}
            onValueChange={(compare: PeriodFilterCompare) => onChange({ ...value, compare })}
          >
            <SelectPrimitive.Trigger asChild>
              <Button size="xs" variant="outline" className="gap-1 font-normal">
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
    </div>
  );
};

const dateToSimpleDateString = (date: Date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

function RangeSelector({
  value,
  onChange,
}: {
  value: PeriodCompareFilterValueType;
  onChange: (val: PeriodCompareFilterValueType) => void;
}) {
  const dateVariables = toVariables(value);

  const [tmpValue, setTmpValue] = React.useState({
    ...value,
    gte: dateToSimpleDateString(dateVariables.dateFrom),
    lte: dateToSimpleDateString(dateVariables.dateTo),
  });

  const setValue = value => {
    setTmpValue(value);
    const parsedValue = periodCompareSchema.safeParse(value);

    // If dates are valid, update the filter
    // Prevents trying to update the query Filter with incomplete dates like "2024-01-"
    if (parsedValue.success) {
      onChange(parsedValue.data);
    }
  };

  const dateRange = {
    from: dayjs(tmpValue.gte),
    to: dayjs(tmpValue.lte),
  };

  return (
    <React.Fragment>
      <div className="flex items-center justify-center gap-2 border-b p-3">
        <Input
          className="h-9 px-2 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          type="date"
          value={tmpValue.gte}
          onChange={e => setValue({ ...tmpValue, type: PeriodFilterType.CUSTOM, gte: e.target.value })}
        />
        <ArrowRight size={14} className="shrink-0" />
        <Input
          className="h-9 px-2 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          type="date"
          value={tmpValue.lte}
          onChange={e => setValue({ ...tmpValue, type: PeriodFilterType.CUSTOM, lte: e.target.value })}
        />
      </div>
      <div className="flex justify-center">
        <Calendar
          mode="range"
          defaultMonth={dateVariables.dateFrom}
          selected={{
            from: dateRange.from.isValid() ? dateRange.from.toDate() : undefined,
            to: dateRange.to.isValid() ? dateRange.to.toDate() : undefined,
          }}
          onSelect={({ from, to }) => {
            setValue({
              type: PeriodFilterType.CUSTOM,
              gte: from ? dateToSimpleDateString(from) : undefined,
              lte: to ? dateToSimpleDateString(to) : undefined,
            });
          }}
          numberOfMonths={1}
        />
      </div>
    </React.Fragment>
  );
}

function toVariables(value: PeriodCompareFilterValueType) {
  let dateFrom, dateTo, compareFrom, compareTo;
  if (value.type === 'CUSTOM') {
    dateFrom = dayjs(value.gte).startOf('day');
    dateTo = dayjs(value.lte).endOf('day');
    if (value.compare === 'PREVIOUS_PERIOD') {
      compareFrom = dateFrom.subtract(dateTo.diff(dateFrom, 'day'), 'day');
      compareTo = dateFrom.endOf('day').subtract(1, 'day');
    }
  } else {
    dateTo = dayjs().endOf('day');
    switch (value.type) {
      case 'ALL_TIME':
        break;
      case 'TODAY':
        dateFrom = dayjs().startOf('day');

        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(1, 'day');
          compareTo = dateTo.subtract(1, 'day');
        }
        break;
      case 'LAST_7_DAYS':
        dateFrom = dayjs().startOf('day').subtract(6, 'day');

        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(7, 'day');
          compareTo = dateTo.subtract(7, 'day');
        }
        break;
      case 'LAST_4_WEEKS':
        dateFrom = dayjs().startOf('day').subtract(27, 'day');

        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(28, 'day');
          compareTo = dateTo.subtract(28, 'day');
        }
        break;
      case 'LAST_3_MONTHS':
        dateFrom = dayjs().startOf('day').subtract(91, 'day');
        // Copying Stripe's behavior for these periods.
        // Possible motivation for 91 days is that it's closest to a quarter of a year: 365/4 = 91.25

        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(92, 'day');
          compareTo = dateTo.subtract(92, 'day');
        }
        break;
      case 'LAST_12_MONTHS':
        dateFrom = dayjs().startOf('month').subtract(11, 'month');
        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(12, 'month');
          compareTo = dateTo.subtract(12, 'month');
        }
        break;
      case 'MONTH_TO_DATE':
        dateFrom = dayjs().startOf('month');
        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(dateTo.diff(dateFrom, 'day') + 1, 'day');
          compareTo = dateFrom.endOf('day').subtract(1, 'day');
        }
        break;
      case 'QUARTER_TO_DATE':
        dateFrom = dayjs().startOf('quarter');
        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(dateTo.diff(dateFrom, 'day') + 1, 'day');
          compareTo = dateFrom.endOf('day').subtract(1, 'day');
        }

        break;
      case 'YEAR_TO_DATE': {
        dateFrom = dayjs().startOf('year');
        if (value.compare === 'PREVIOUS_PERIOD') {
          compareFrom = dateFrom.subtract(dateTo.diff(dateFrom, 'day') + 1, 'day');
          compareTo = dateFrom.endOf('day').subtract(1, 'day');
        }
      }
    }
  }

  if (value.type !== 'ALL_TIME') {
    switch (value.compare) {
      case 'PREVIOUS_MONTH':
        compareFrom = dateFrom.subtract(1, 'month');
        compareTo = dateTo.subtract(1, 'month');
        break;
      case 'PREVIOUS_QUARTER':
        compareFrom = dateFrom.subtract(1, 'quarter');
        compareTo = dateTo.subtract(1, 'quarter');
        break;
      case 'PREVIOUS_YEAR':
        compareFrom = dateFrom.subtract(1, 'year');
        compareTo = dateTo.subtract(1, 'year');
        break;
    }
  }

  return {
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
    compareFrom: compareFrom?.toISOString(),
    compareTo: compareTo?.toISOString(),
    includeComparison: Boolean(compareFrom && compareTo),
  };
}

export const periodCompareFilter: FilterConfig<z.infer<typeof periodCompareSchema>> = {
  schema: periodCompareSchema,
  toVariables,
  filter: {
    static: true,
    StandaloneComponent: PeriodCompareFilter,
  },
};
