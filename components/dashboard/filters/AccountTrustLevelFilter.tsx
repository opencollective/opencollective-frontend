import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '@/lib/filters/filter-types';
import { isMulti } from '@/lib/filters/schemas';

import ComboSelectFilter from './ComboSelectFilter';

enum TRUST_LEVELS {
  VERIFIED = 'VERIFIED',
  FIRST_PARTY = 'FIRST_PARTY',
}

const AccountTrustLevelMessages = defineMessages({
  [TRUST_LEVELS.VERIFIED]: {
    id: 'TrustLevel.Trusted',
    defaultMessage: 'Trusted',
  },
  [TRUST_LEVELS.FIRST_PARTY]: {
    id: 'TrustLevel.FirstParty',
    defaultMessage: 'First Party',
  },
});

type AccountTrustLevelFilterValue = z.infer<typeof schema>;

const schema = isMulti(z.nativeEnum(TRUST_LEVELS)).optional();

export const accountTrustLevelFilter: FilterConfig<AccountTrustLevelFilterValue> = {
  schema,
  filter: {
    labelMsg: defineMessage({ id: 'TrustLevel.Label', defaultMessage: 'Trust Level' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () =>
          Object.keys(TRUST_LEVELS).map(value => ({
            label: intl.formatMessage(AccountTrustLevelMessages[value]),
            value,
          })),
        [intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(AccountTrustLevelMessages[value]),
  },
  toVariables: value => {
    const variables = {};
    if (value.includes(TRUST_LEVELS.VERIFIED)) {
      variables['isVerified'] = true;
    }
    if (value.includes(TRUST_LEVELS.FIRST_PARTY)) {
      variables['isFirstPartyHost'] = true;
    }
    return variables;
  },
};
