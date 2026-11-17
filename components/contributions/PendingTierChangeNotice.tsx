import React from 'react';
import { Clock } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

import DateTime from '../DateTime';
import I18nFormatters from '../I18nFormatters';

type PendingTierChange = {
  tier?: { name?: string } | null;
};

/**
 * A recurring contribution moving to a tier that hasn't been paid for yet: the tier only applies once a
 * payment at the new amount succeeds, typically on the next charge date.
 */
export const PendingTierChangeNotice = ({
  pendingTierChange,
  nextChargeDate,
  className,
}: {
  pendingTierChange: PendingTierChange | null | undefined;
  nextChargeDate?: string | null;
  className?: string;
}) => {
  if (!pendingTierChange?.tier) {
    return null;
  }

  return (
    <div
      className={cn('flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700', className)}
      data-cy="pending-tier-change"
    >
      <Clock size={16} className="mt-0.5 shrink-0 text-slate-500" />
      <span>
        {nextChargeDate ? (
          <FormattedMessage
            defaultMessage="Moving to <strong>{tierName}</strong> after the next payment, on {date}."
            id="PendingTierChange.WithDate"
            values={{
              ...I18nFormatters,
              tierName: pendingTierChange.tier.name,
              date: <DateTime value={nextChargeDate} dateStyle="long" />,
            }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="Moving to <strong>{tierName}</strong> after the next payment."
            id="PendingTierChange.NoDate"
            values={{ ...I18nFormatters, tierName: pendingTierChange.tier.name }}
          />
        )}
      </span>
    </div>
  );
};

/** The tier a contribution targets: the pending one if an upgrade is waiting for a payment, otherwise the current one. */
export const getTargetTier = <T extends { id: string }>(order: {
  tier?: T | null;
  pendingTierChange?: { tier?: T | null } | null;
}): T | null => order?.pendingTierChange?.tier || order?.tier || null;
