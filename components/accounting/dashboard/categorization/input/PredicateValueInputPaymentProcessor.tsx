import React from 'react';

import { PaymentMethodService } from '@/lib/graphql/types/v2/schema';

import { Op } from '../rules';

import { RuleValueInputSelect } from './RuleValueInputSelect';
import type { PredicateInputProps } from './types';

export function PredicateValueInputPaymentProcessor({
  value,
  onChange,
  operator,
  className,
  error,
}: PredicateInputProps) {
  return (
    <RuleValueInputSelect
      className={className}
      value={value}
      onChange={onChange}
      options={[
        { label: 'Stripe', value: PaymentMethodService.STRIPE },
        { label: 'PayPal', value: PaymentMethodService.PAYPAL },
        { label: 'OpenCollective', value: PaymentMethodService.OPENCOLLECTIVE },
      ]}
      isMulti={operator === Op.in}
      shouldFilter={false}
      error={!!error}
    />
  );
}
