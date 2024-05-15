import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';
import { ExpectedFundsFilter } from '../../../lib/graphql/types/v2/graphql';

import ComboSelectFilter from './ComboSelectFilter';

const schema = z.nativeEnum(ExpectedFundsFilter).optional();

export const expectedFundsFilter: FilterConfig<z.infer<typeof schema>> = {
  schema: schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Expected Funds', id: 'ExpectedFunds' }),
    Component: ({ valueRenderer, intl, ...props }) => {
      const options = React.useMemo(
        () => Object.values(ExpectedFundsFilter).map(value => ({ label: valueRenderer({ intl, value }), value })),
        [intl, valueRenderer],
      );
      return <ComboSelectFilter isMulti={false} options={options} {...props} />;
    },
    valueRenderer: ({ value }) =>
      value === ExpectedFundsFilter.MANUAL ? (
        <FormattedMessage defaultMessage="Created by contributors" id="wa5frV" />
      ) : (
        <FormattedMessage defaultMessage="Created by host admin" id="See4A8" />
      ),
  },
};
