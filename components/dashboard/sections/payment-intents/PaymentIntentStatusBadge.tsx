import React from 'react';
import { useIntl } from 'react-intl';

import type { PaymentIntentStatus } from '../../../../lib/graphql/types/v2/graphql';
import { getPaymentIntentStatusBadgeType, i18nPaymentIntentStatus } from '../../../../lib/i18n/payment-intent';

import { Badge } from '../../../ui/Badge';

type PaymentIntentStatusBadgeProps = {
  status: PaymentIntentStatus | string;
  className?: string;
};

export const PaymentIntentStatusBadge = ({ status, className }: PaymentIntentStatusBadgeProps) => {
  const intl = useIntl();

  return (
    <Badge type={getPaymentIntentStatusBadgeType(status)} size="sm" className={className}>
      {i18nPaymentIntentStatus(intl, status)}
    </Badge>
  );
};
