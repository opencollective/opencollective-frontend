import React, { useMemo } from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';

import ComboSelectFilter from './ComboSelectFilter';

const schema = isMulti(z.string()).optional();

export const currencyFilter: FilterConfig<z.infer<typeof schema>> = {
  schema,
  filter: {
    Component: props => {
      const options = useMemo(
        () =>
          (props.meta.currencies || []).map(value => ({
            label: value,
            value,
          })),
        [props.meta.currencies],
      );
      return <ComboSelectFilter options={options} {...props} isMulti />;
    },
    labelMsg: defineMessage({ defaultMessage: 'Currency', id: 'Currency' }),
  },
};
