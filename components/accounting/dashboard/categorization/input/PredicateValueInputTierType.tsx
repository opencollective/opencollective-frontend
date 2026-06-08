import React from 'react';

import { TierType } from '@/lib/graphql/types/v2/schema';

import { Op } from '../rules';

import { RuleValueInputSelect } from './RuleValueInputSelect';
import type { PredicateInputProps } from './types';

export function PredicateValueInputTierType({ value, onChange, operator, className, error }: PredicateInputProps) {
  return (
    <RuleValueInputSelect
      className={className}
      value={value}
      onChange={onChange}
      options={Object.values(TierType).map(t => ({ label: t, value: t }))}
      isMulti={operator === Op.in}
      shouldFilter={false}
      error={!!error}
    />
  );
}
