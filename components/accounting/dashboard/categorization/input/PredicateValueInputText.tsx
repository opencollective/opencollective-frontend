import React from 'react';

import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/Input';

import type { PredicateInputProps } from './types';

export function PredicateValueInputText({ value, onChange, className, error }: PredicateInputProps) {
  return (
    <Input
      className={cn('min-w-[140px] flex-1', className)}
      value={(value as string) ?? ''}
      onChange={e => onChange(e.target.value || null)}
      placeholder="Value"
      error={!!error}
    />
  );
}
