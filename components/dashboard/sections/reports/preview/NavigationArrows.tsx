import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import dayjs from '../../../../../lib/dayjs';

import { Button } from '../../../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';

import { isCurrentPeriod } from './helpers';
import { serializeReportSlug } from './ReportPeriodSelector';

export function ReportNavigationArrows({ variables, onChange }) {
  const dateFrom = dayjs.utc(variables.dateFrom);

  const previousDateFrom = dateFrom.subtract(1, variables.timeUnit);
  const previousReportSlug = serializeReportSlug({
    timeUnit: variables.timeUnit,
    dateFrom: previousDateFrom.toISOString(),
    dateTo: previousDateFrom.endOf(variables.timeUnit).toISOString(),
  });

  const nextDateFrom = dateFrom.add(1, variables.timeUnit);
  const nextDateTo = nextDateFrom.endOf(variables.timeUnit);
  const nextReportSlug = serializeReportSlug({
    timeUnit: variables.timeUnit,
    dateFrom: nextDateFrom.toISOString(),
    dateTo: nextDateTo.toISOString(),
  });
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="outline" onClick={() => onChange(previousReportSlug)}>
            <ArrowLeft size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <FormattedMessage
            defaultMessage="Previous {timeUnit, select, MONTH {month} QUARTER {quarter} YEAR {year} other {period}}"
            values={{ timeUnit: variables.timeUnit }}
          />
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={isCurrentPeriod(variables)}
            size="icon-sm"
            variant="outline"
            onClick={() => onChange(nextReportSlug)}
          >
            <ArrowRight size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <FormattedMessage
            defaultMessage="Next {timeUnit, select, MONTH {month} QUARTER {quarter} YEAR {year} other {period}}"
            values={{ timeUnit: variables.timeUnit }}
          />
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
