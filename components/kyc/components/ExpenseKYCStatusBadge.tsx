import React from 'react';
import { cva } from 'class-variance-authority';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ExpensePayeeKycStatus } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/Badge';

type ExpenseKYCStatusBadgeProps = {
  status: ExpensePayeeKycStatus;
  className?: string;
};

const i18nExpensePayeeKycStatus = defineMessages({
  [ExpensePayeeKycStatus.PENDING]: {
    defaultMessage: 'KYC Pending', id: 'YC8RDd',
  },
  [ExpensePayeeKycStatus.VERIFIED]: {
    defaultMessage: 'KYC Verified', id: 'eEXNr4',
  },
});

const classVariants = cva('rounded-sm px-2 py-0.75 text-[11px] font-bold tracking-wide uppercase', {
  variants: {
    status: {
      [ExpensePayeeKycStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ExpensePayeeKycStatus.VERIFIED]: 'bg-green-100 text-green-800',
      [ExpensePayeeKycStatus.NOT_REQUESTED]: 'bg-gray-100 text-gray-800',
    },
  },
});

export function ExpenseKYCStatusBadge(props: ExpenseKYCStatusBadgeProps) {
  if (props.status === ExpensePayeeKycStatus.NOT_REQUESTED) {
    return null;
  }

  return (
    <Badge type="info" className={cn(classVariants({ status: props.status }), props.className)}>
      <FormattedMessage {...i18nExpensePayeeKycStatus[props.status]} />
    </Badge>
  );
}
