import React from 'react';
import clsx from 'clsx';
import { InfoIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

export function Timezonepicker({ value = 'local', onChange }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        <h3 className="my-1 text-xs font-medium text-muted-foreground">
          <FormattedMessage defaultMessage="Timezone" />
        </h3>
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <InfoIcon size={12} />
          </TooltipTrigger>
          <TooltipContent className="max-w-[320px]">
            <FormattedMessage defaultMessage="By default, all dates are filtered and displayed using your local timezone. You can switch to UTC to indicate that the dates provided above use the Coordinated Universal Time format, which matches how email reports are generated" />
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 rounded-md bg-slate-100 p-1">
        <button
          type="button"
          className={clsx(
            'rounded-md py-1',
            value === 'local' ? 'bg-white text-foreground shadow-sm' : 'bg-transparent text-muted-foreground',
          )}
          onClick={() => onChange('local')}
        >
          <FormattedMessage id="Timezone.Local" defaultMessage="Local" />
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-md py-1',
            value === 'UTC' ? 'bg-white text-foreground shadow-sm' : 'bg-transparent text-muted-foreground',
          )}
          onClick={() => onChange('UTC')}
        >
          <FormattedMessage id="Timezone.UTC" defaultMessage="UTC" />
        </button>
      </div>
    </div>
  );
}
