import React from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { getDayjsIsoUnit } from '../../../../../lib/date-utils';
import dayjs from '../../../../../lib/dayjs';
import { FilterComponentProps } from '../../../../../lib/filters/filter-types';
import { Host, TimeUnit } from '../../../../../lib/graphql/types/v2/graphql';

import { Button } from '../../../../ui/Button';
import { Label } from '../../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/Popover';

import { CurrentPeriodBadge } from './CurrentPeriodBadge';

const timeUnitSchema = z.enum(['MONTH', 'QUARTER', 'YEAR']);

const reportSlugSchema = z.union([
  z.string().regex(/^\d{4}$/), // Years: "2023", "2022", etc.
  z.string().regex(/^\d{4}-Q[1-4]$/), // Quarters: "2023-Q1", "2023-Q2", etc.
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), // Months: "2023-01", "2023-02", etc.
]);

export const variablesSchema = z.object({
  timeUnit: timeUnitSchema,
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});

const deserializeSchema = reportSlugSchema
  .transform(period => {
    let dateFrom, dateTo, timeUnit;

    if (period.includes('-Q')) {
      // Quarter logic
      const [year, quarter] = period.split('-Q');
      dateFrom = dayjs.utc(`${year}-01-01`).quarter(parseInt(quarter)).startOf('quarter');
      dateTo = dayjs.utc(`${year}-01-01`).quarter(parseInt(quarter)).endOf('quarter');
      timeUnit = 'QUARTER';
    } else if (period.includes('-')) {
      // Month logic
      dateFrom = dayjs.utc(period).startOf('month');
      dateTo = dayjs.utc(period).endOf('month');
      timeUnit = 'MONTH';
    } else {
      // Year logic
      dateFrom = dayjs.utc(`${period}-01-01`).startOf('year');
      dateTo = dayjs.utc(`${period}-01-01`).endOf('year');
      timeUnit = 'YEAR';
    }

    const now = dayjs.utc();
    if (dateTo.isAfter(now)) {
      dateTo = now.endOf('day');
    }

    return {
      timeUnit,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  })
  .pipe(variablesSchema);

const serializeSchema = variablesSchema.transform(({ dateFrom, timeUnit }) => {
  const date = dayjs.utc(dateFrom);
  switch (timeUnit) {
    case 'YEAR':
      return date.format('YYYY');
    case 'QUARTER':
      return `${date.format('YYYY')}-Q${date.quarter()}`;
    case 'MONTH':
      return date.format('YYYY-MM');
  }
});

export const deserializeReportSlug = (slug: z.infer<typeof reportSlugSchema>) => {
  const safeParse = deserializeSchema.safeParse(slug);
  if (safeParse.success) {
    return safeParse.data;
  }
  return null;
};

export const serializeReportSlug = (variables: z.infer<typeof variablesSchema>) => {
  const safeParse = serializeSchema.safeParse(variables);
  if (safeParse.success) {
    return safeParse.data;
  }
  return null;
};

// Get an array of all years from earliestDate to now
function getAvailableYears(hostCreatedAt: string) {
  const now = dayjs.utc();
  const earliestDate = dayjs.utc(hostCreatedAt);
  const availableYears = [];
  let currentYear = now.year();

  while (currentYear >= earliestDate.year()) {
    availableYears.push(currentYear);
    currentYear--;
  }
  return availableYears;
}

export const renderReportPeriodLabel = variables => {
  const dayjsIsoUnit = getDayjsIsoUnit(variables.timeUnit as TimeUnit);

  if (variables.timeUnit === 'MONTH') {
    return dayjs.utc(variables.dateFrom).format('MMMM YYYY');
  } else if (variables.timeUnit === 'QUARTER') {
    return `${dayjs.utc(variables.dateFrom).format('MMM')} - ${dayjs.utc(variables.dateFrom).endOf(dayjsIsoUnit).format('MMM YYYY')} (Q${dayjs.utc(variables.dateFrom).quarter()})`;
  } else if (variables.timeUnit === 'YEAR') {
    return dayjs.utc(variables.dateFrom).format('YYYY');
  }
};

type FilterMeta = {
  hostCreatedAt: Host['createdAt'];
};

export const ReportPeriodSelector = ({
  onChange,
  value,
  meta,
}: FilterComponentProps<z.infer<typeof reportSlugSchema>, FilterMeta>) => {
  const variables = deserializeReportSlug(value);
  const currentYear = dayjs.utc().year();
  const [selectedYear, setSelectedYear] = React.useState(dayjs.utc(variables.dateTo).year());
  const [selectedTimeUnit, setSelectedTimeUnit] = React.useState(variables.timeUnit);

  const availableYears = getAvailableYears(meta.hostCreatedAt);
  const now = dayjs.utc();
  const dateFrom = dayjs.utc(variables.dateFrom);
  const dateTo = dayjs.utc(variables.dateTo);

  return (
    <div className="flex items-center gap-2">
      <Popover
        onOpenChange={open => {
          if (open) {
            setSelectedYear(dayjs.utc(variables.dateTo).year());
            setSelectedTimeUnit(variables.timeUnit);
          }
        }}
      >
        <PopoverTrigger className="group">
          <div className="flex items-center gap-1 tracking-tight">
            {renderReportPeriodLabel(variables)}
            <ChevronDown className="text-muted-foreground transition-colors group-hover:text-foreground" size={20} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-3 sm:max-w-64">
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-2 rounded-md bg-slate-100 p-1 text-sm">
              <button
                type="button"
                className={clsx(
                  'rounded-md py-1',
                  selectedTimeUnit === 'MONTH'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground',
                )}
                onClick={() => setSelectedTimeUnit('MONTH')}
              >
                <FormattedMessage id="Frequency.Monthly" defaultMessage="Monthly" />
              </button>
              <button
                type="button"
                className={clsx(
                  'rounded-md py-1',
                  selectedTimeUnit === 'QUARTER'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground',
                )}
                onClick={() => setSelectedTimeUnit('QUARTER')}
              >
                <FormattedMessage id="quarter" defaultMessage="Quarterly" />
              </button>
              <button
                type="button"
                className={clsx(
                  'rounded-md py-1',
                  selectedTimeUnit === 'YEAR'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground',
                )}
                onClick={() => setSelectedTimeUnit('YEAR')}
              >
                <FormattedMessage id="Frequency.Yearly" defaultMessage="Yearly" />
              </button>
            </div>
            {selectedTimeUnit !== 'YEAR' && (
              <div className="flex items-center justify-between">
                <Button variant="outline" size="icon-xs" onClick={() => setSelectedYear(selectedYear - 1)}>
                  <ArrowLeft size={16} />
                </Button>
                <Label className="tracking-tight">{selectedYear}</Label>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={currentYear === selectedYear}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
            )}

            <div className="">
              {selectedTimeUnit === 'MONTH' ? (
                <div className="grid grid-cols-3 gap-1">
                  {Array(12)
                    .fill(null)
                    .map((_, i) => i)
                    .map(month => {
                      const monthDate = now.year(selectedYear).month(month);
                      const yearOfSelection = dateTo.year();
                      const isActive =
                        variables.timeUnit === selectedTimeUnit &&
                        yearOfSelection === selectedYear &&
                        month === dateFrom.month();
                      const currentMonth = now.month();
                      const disabled = currentYear === selectedYear && month > currentMonth;
                      const period = `${selectedYear}-${(month + 1).toString().padStart(2, '0')}`;
                      return (
                        <Button
                          key={period}
                          variant={isActive ? 'default' : 'ghost'}
                          size="xs"
                          onClick={() => onChange(period)}
                          disabled={disabled}
                        >
                          {monthDate.format('MMMM')}
                        </Button>
                      );
                    })}
                </div>
              ) : selectedTimeUnit === 'QUARTER' ? (
                <div className="grid grid-cols-1 gap-1">
                  {Array(4)
                    .fill(null)
                    .map((_, i) => i + 1)
                    .map(quarter => {
                      const quarterDate = now.year(selectedYear).quarter(quarter);
                      const yearOfSelection = dateTo.year();
                      const isActive =
                        variables.timeUnit === selectedTimeUnit &&
                        yearOfSelection === selectedYear &&
                        quarter === dateFrom.quarter();
                      const currentQuarter = now.quarter();
                      const disabled = currentYear === selectedYear && quarter > currentQuarter;
                      const period = `${selectedYear}-Q${quarter}`;
                      return (
                        <Button
                          key={period}
                          variant={isActive ? 'default' : 'ghost'}
                          size="xs"
                          onClick={() => onChange(period)}
                          disabled={disabled}
                        >
                          {quarterDate.startOf('quarter').format('MMMM')} -{' '}
                          {quarterDate.endOf('quarter').format('MMMM')}{' '}
                        </Button>
                      );
                    })}
                </div>
              ) : selectedTimeUnit === 'YEAR' ? (
                <div className="grid grid-cols-1 gap-1">
                  {availableYears.map(year => {
                    const isActive = variables.timeUnit === selectedTimeUnit && year === dateFrom.year();
                    const currentyear = now.year();
                    const disabled = currentYear === selectedYear && year > currentyear;

                    const period = year.toString();
                    return (
                      <Button
                        key={period}
                        variant={isActive ? 'default' : 'ghost'}
                        size="xs"
                        onClick={() => onChange(period)}
                        disabled={disabled}
                      >
                        {year}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <CurrentPeriodBadge variables={variables} size="default" />
    </div>
  );
};
