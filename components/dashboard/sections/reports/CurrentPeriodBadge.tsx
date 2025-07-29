import React from 'react';
import { FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import type { BadgeProps } from '../../../ui/Badge';
import { Badge } from '../../../ui/Badge';

import { isCurrentPeriod } from './helpers';
import type { variablesSchema } from './ReportPeriodSelector';

export function CurrentPeriodBadge({
  variables,
  size = 'xs',
}: {
  variables: z.infer<typeof variablesSchema>;
  size?: BadgeProps['size'];
}) {
  const isThisPeriod = isCurrentPeriod(variables);

  if (!isThisPeriod) {
    return null;
  }
  return (
    <Badge type="warning" size={size} className="tracking-normal">
      <FormattedMessage
        defaultMessage="{timeUnit, select, MONTH {Month} QUARTER {Quarter} YEAR {Year} other {Current period}} to date"
        id="JtDPrj"
        values={{ timeUnit: variables.timeUnit }}
      />
    </Badge>
  );
}
