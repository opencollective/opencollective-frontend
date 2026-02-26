import React from 'react';

import { AccountType } from '@/lib/graphql/types/v2/schema';

import { Op } from '../rules';

import { RuleValueInputSelect } from './RuleValueInputSelect';
import type { PredicateInputProps } from './types';

export function PredicateValueInputAccountType({ value, onChange, operator, className, error }: PredicateInputProps) {
  return (
    <RuleValueInputSelect
      className={className}
      value={value}
      onChange={onChange}
      options={Object.values(AccountType).map(t => ({ label: t, value: t }))}
      isMulti={operator === Op.in}
      shouldFilter={false}
      error={!!error}
    />
  );
}
