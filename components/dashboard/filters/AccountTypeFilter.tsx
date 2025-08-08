import React, { useMemo } from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '@/lib/constants/collectives';
import type { FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';
import formatCollectiveType from '@/lib/i18n/collective-type';

import ComboSelectFilter from './ComboSelectFilter';

export { CollectiveType };

export const buildAccountTypeFilter = ({
  types = CollectiveType,
  defaultValue,
  optional,
}: {
  types?: Partial<typeof CollectiveType>;
  defaultValue?: (keyof typeof CollectiveType)[];
  optional?: boolean;
}) => {
  const baseSchema = isMulti(z.nativeEnum(types));
  const schema = defaultValue ? baseSchema.default(defaultValue) : optional ? baseSchema.optional() : baseSchema;

  return {
    schema,
    filter: {
      labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
      Component: ({ intl, ...props }) => {
        const options = useMemo(
          () =>
            Object.values(types).map(value => ({
              label: formatCollectiveType(intl, value),
              value,
            })),
          [intl],
        );
        return <ComboSelectFilter options={options} isMulti {...props} />;
      },
      valueRenderer: ({ value, intl }) => formatCollectiveType(intl, value),
    },
  } as FilterConfig<z.infer<typeof schema>>;
};
