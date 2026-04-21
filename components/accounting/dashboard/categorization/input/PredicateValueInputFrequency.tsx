import React from 'react';
import { useIntl } from 'react-intl';

import { TierFrequency } from '@/lib/graphql/types/v2/schema';
import { i18nFrequency } from '@/lib/i18n/order';

import { Op } from '../rules';

import { RuleValueInputSelect } from './RuleValueInputSelect';
import type { PredicateInputProps } from './types';

export function PredicateValueInputFrequency({ value, onChange, operator, className, error }: PredicateInputProps) {
  const intl = useIntl();
  return (
    <RuleValueInputSelect
      className={className}
      value={value}
      onChange={onChange}
      options={Object.values(TierFrequency)
        .filter(t => t !== TierFrequency.FLEXIBLE)
        .map(t => ({ label: i18nFrequency(intl, t), value: t }))}
      isMulti={operator === Op.in}
      shouldFilter={false}
      error={!!error}
    />
  );
}
