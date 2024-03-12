import React from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { getDayjsIsoUnit, getDayjsOpUnit } from '../../../../../lib/date-utils';
import dayjs from '../../../../../lib/dayjs';
import { FilterComponentProps } from '../../../../../lib/filters/filter-types';
import { Host, TimeUnit } from '../../../../../lib/graphql/types/v2/graphql';

import { Button } from '../../../../ui/Button';
import { Label } from '../../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/Popover';

const timeUnitSchema = z.enum(['MONTH', 'QUARTER', 'YEAR']);
const periodFilterSchema = z
  .object({
    timeUnit: timeUnitSchema,
    gt: z.string().optional(),
    lt: z.string().optional(),
  })
  .transform(val => {
    if (!val.gt || !val.lt) {
      return {
        timeUnit: val.timeUnit,
        gt: dayjs
          .utc()
          .startOf(getDayjsIsoUnit(val.timeUnit as TimeUnit))
          .toISOString(),
        lt: dayjs.utc().endOf('day').toISOString(),
      };
    }
    return { timeUnit: val.timeUnit, gt: val.gt, lt: val.lt };
  })
  .default(() => {
    return {
      timeUnit: 'MONTH' as z.infer<typeof timeUnitSchema>,
      gt: dayjs.utc().startOf('month').toISOString(),
      lt: dayjs.utc().endOf('day').toISOString(),
    };
  });

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

const renderCurrentLabel = value => {
  const dayjsIsoUnit = getDayjsIsoUnit(value.timeUnit as TimeUnit);

  if (value.timeUnit === 'MONTH') {
    return dayjs.utc(value.gt).format('MMMM YYYY');
  } else if (value.timeUnit === 'QUARTER') {
    return `${dayjs.utc(value.gt).format('MMM')} - ${dayjs.utc(value.gt).endOf(dayjsIsoUnit).format('MMM YYYY')}`;
  } else if (value.timeUnit === 'YEAR') {
    return dayjs.utc(value.gt).format('YYYY');
  }
};

type FilterMeta = {
  hostCreatedAt: Host['createdAt'];
};

const PeriodFilter = ({
  onChange,
  value,
  meta,
}: FilterComponentProps<z.infer<typeof periodFilterSchema>, FilterMeta>) => {
  const currentYear = dayjs.utc().year();
  const [selectedYear, setSelectedYear] = React.useState(dayjs.utc(value.lt).year());
  const [selectedTimeUnit, setSelectedTimeUnit] = React.useState(value.timeUnit);

  const availableYears = getAvailableYears(meta.hostCreatedAt);
  const now = dayjs.utc();
  const dateFrom = dayjs.utc(value.gt);
  const dayjsIsoUnit = getDayjsIsoUnit(value.timeUnit as TimeUnit);
  const dayjsOpUnit = getDayjsOpUnit(value.timeUnit as TimeUnit);
  const isCurrentPeriodComplete = dateFrom.endOf(dayjsIsoUnit).isBefore(now);

  return (
    <div className="flex items-center">
      <Button
        size="xs"
        variant="outline"
        className="rounded-full rounded-r-none border-r-0"
        onClick={() => {
          const gt = dayjs.utc(value.gt).subtract(1, dayjsOpUnit);
          const lt = gt.endOf(dayjsIsoUnit);
          onChange({
            timeUnit: value.timeUnit,
            gt: gt.toISOString(),
            lt: lt.toISOString(),
          });
        }}
      >
        <ArrowLeft size={16} />
      </Button>
      <Popover
        onOpenChange={open => {
          if (open) {
            setSelectedYear(dayjs.utc(value.lt).year());
            setSelectedTimeUnit(value.timeUnit);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button size="xs" variant="outline" className="rounded-none">
            {renderCurrentLabel(value)} <ChevronDown size={16} />
          </Button>
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
                      const monthDate = dayjs.utc().year(selectedYear).month(month);
                      const yearOfSelection = dayjs.utc(value.lt).year();
                      const isActive =
                        value.timeUnit === selectedTimeUnit &&
                        yearOfSelection === selectedYear &&
                        month === dayjs.utc(value.gt).month();
                      const currentMonth = dayjs.utc().month();
                      const disabled = currentYear === selectedYear && month > currentMonth;
                      const dayjsIsoUnit = getDayjsIsoUnit(selectedTimeUnit as TimeUnit);

                      return (
                        <Button
                          key={`m-${month}`}
                          variant={isActive ? 'default' : 'ghost'}
                          size="xs"
                          onClick={() =>
                            onChange({
                              timeUnit: selectedTimeUnit,
                              gt: monthDate.startOf(dayjsIsoUnit).toISOString(),
                              lt: monthDate.endOf(dayjsIsoUnit).toISOString(),
                            })
                          }
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
                      const quarterDate = dayjs.utc().year(selectedYear).quarter(quarter);
                      const yearOfSelection = dayjs.utc(value.lt).year();
                      const isActive =
                        value.timeUnit === selectedTimeUnit &&
                        yearOfSelection === selectedYear &&
                        quarter === dayjs.utc(value.gt).quarter();
                      const currentQuarter = dayjs.utc().quarter();
                      const disabled = currentYear === selectedYear && quarter > currentQuarter;

                      const dayjsIsoUnit = getDayjsIsoUnit(selectedTimeUnit as TimeUnit);
                      return (
                        <Button
                          key={`q-${quarter}`}
                          variant={isActive ? 'default' : 'ghost'}
                          size="xs"
                          onClick={() =>
                            onChange({
                              timeUnit: selectedTimeUnit,
                              gt: quarterDate.startOf(dayjsIsoUnit).toISOString(),
                              lt: quarterDate.endOf(dayjsIsoUnit).toISOString(),
                            })
                          }
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
                    const yearDate = dayjs.utc().year(year);
                    const isActive = value.timeUnit === selectedTimeUnit && year === dayjs.utc(value.gt).year();
                    const currentyear = dayjs.utc().year();
                    const disabled = currentYear === selectedYear && year > currentyear;

                    const dayjsIsoUnit = getDayjsIsoUnit(selectedTimeUnit as TimeUnit);
                    return (
                      <Button
                        key={`y-${year}`}
                        variant={isActive ? 'default' : 'ghost'}
                        size="xs"
                        onClick={() =>
                          onChange({
                            timeUnit: selectedTimeUnit,
                            gt: yearDate.startOf(dayjsIsoUnit).toISOString(),
                            lt: yearDate.endOf(dayjsIsoUnit).toISOString(),
                          })
                        }
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

      <Button
        disabled={!isCurrentPeriodComplete}
        size="xs"
        variant="outline"
        className="rounded-full rounded-l-none border-l-0"
        onClick={() => {
          const gt = dateFrom.add(1, dayjsOpUnit);
          let lt = gt.endOf(dayjsIsoUnit);
          lt = lt.isBefore(now) ? lt : now;
          onChange({
            timeUnit: value.timeUnit,
            gt: gt.toISOString(),
            lt: lt.toISOString(),
          });
        }}
      >
        <ArrowRight size={16} />
      </Button>
    </div>
  );
};

export const periodFilter = {
  schema: periodFilterSchema,
  filter: {
    static: true,
    StandaloneComponent: PeriodFilter,
  },
  toVariables: ({ lt, gt }) => ({
    dateFrom: gt,
    dateTo: lt,
  }),
};
