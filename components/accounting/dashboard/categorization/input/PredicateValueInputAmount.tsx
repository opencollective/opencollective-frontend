import React from 'react';

import InputAmount from '@/components/InputAmount';

import type { PredicateInputProps } from './types';

export function PredicateValueInputAmount({ value, onChange, className, error }: PredicateInputProps) {
  return <InputAmount className={className} value={value} onChange={onChange} error={!!error} currency="USD" />;
}
