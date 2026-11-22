import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';
import { MissingInformationField } from '@/lib/graphql/types/v2/graphql';
import { formatMissingInformation } from '@/lib/i18n/missing-information';
import { sortSelectOptions } from '@/lib/utils';

import ComboSelectFilter from '../../filters/ComboSelectFilter';

const US_TAX_FORM_FIELDS = [
  MissingInformationField.US_TAX_FORM_CURRENT_YEAR,
  MissingInformationField.US_TAX_FORM_PREVIOUS_YEAR,
];

const MissingInformationSchema = isMulti(z.nativeEnum(MissingInformationField)).optional();

export const missingInformationFilter: FilterConfig<z.infer<typeof MissingInformationSchema>> = {
  schema: MissingInformationSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Missing information', id: 'MissingInformation' }),
    Component: ({ valueRenderer, intl, meta, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(MissingInformationField)
          // The US tax form options are only available to hosts with the Tax Forms feature
          .filter(value => !US_TAX_FORM_FIELDS.includes(value) || meta?.supportsTaxForm)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => {
      return formatMissingInformation(intl, value);
    },
  },
};
