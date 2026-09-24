import React from 'react';
import { cva } from 'class-variance-authority';
import { useIntl } from 'react-intl';

import { KycVerificationStatus } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import { Badge } from '../ui/Badge';

import { i18nKYCVerificationStatus } from './intl';

type KYCVerificationStatusBadgeProps = {
  status: KycVerificationStatus;
  label?: React.ReactNode;
  size?: 'sm' | 'default';
  className?: string;
};

const classVariants = cva('rounded-sm px-2 py-0.75 text-[11px] font-bold tracking-wide uppercase', {
  variants: {
    status: {
      [KycVerificationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [KycVerificationStatus.VERIFIED]: 'bg-green-100 text-green-800',
      [KycVerificationStatus.FAILED]: 'bg-red-100 text-red-800',
      [KycVerificationStatus.REVOKED]: 'bg-red-100 text-red-800',
      [KycVerificationStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
    },
  },
  defaultVariants: {
    status: KycVerificationStatus.PENDING,
  },
});

export function KYCVerificationStatusBadge({ status, label, size, className }: KYCVerificationStatusBadgeProps) {
  const intl = useIntl();
  return (
    <Badge type="info" size={size} className={cn(classVariants({ status }), className)}>
      {label}
      {i18nKYCVerificationStatus(intl, status)}
    </Badge>
  );
}
