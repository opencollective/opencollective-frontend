import React from 'react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { Badge, BadgeProps } from '../../../../ui/Badge';

import { isCurrentPeriod } from './helpers';
import { variablesSchema } from './ReportPeriodSelector';

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
        values={{ timeUnit: variables.timeUnit }}
      />
    </Badge>
  );
}
