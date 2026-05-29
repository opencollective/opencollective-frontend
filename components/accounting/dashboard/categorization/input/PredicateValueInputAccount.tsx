import React from 'react';

import { DefaultCollectiveLabel } from '@/components/CollectivePicker';
import CollectivePickerAsync from '@/components/CollectivePickerAsync';

import { Op } from '../rules';

import type { PredicateInputProps } from './types';

export function PredicateValueInputAccount({ value, onChange, operator, host, className, error }: PredicateInputProps) {
  const onSelectChange = React.useCallback(
    value => {
      if (Array.isArray(value)) {
        onChange(value.map(v => v.value.slug));
      } else {
        onChange(value?.value?.slug);
      }
    },
    [onChange],
  );

  React.useEffect(() => {
    if (operator !== Op.in && Array.isArray(value)) {
      onChange(value[0]);
    }
  }, [operator, value, onChange]);

  const selectValue = Array.isArray(value) ? value.map(v => ({ slug: v })) : value ? { slug: value } : null;

  return (
    <div>
      <CollectivePickerAsync
        formatOptionLabel={(option, context) => {
          if (option.value.__typename) {
            return DefaultCollectiveLabel(option, context);
          }

          return `@${option.value.slug}`;
        }}
        className={className}
        inputId="predicate-value-account"
        hostCollectiveIds={[host.legacyId]}
        collective={selectValue}
        onChange={onSelectChange}
        isMulti={operator === Op.in}
        types={['ORGANIZATION', 'PROJECT', 'COLLECTIVE', 'FUND', 'EVENT']}
        error={!!error}
      />
    </div>
  );
}
