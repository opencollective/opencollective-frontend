import type { IntlShape } from 'react-intl';
import { defineMessage, defineMessages } from 'react-intl';

import { formatCurrency, type Options as FormatCurrencyOptions } from '../currency-utils';
import type { Amount, Currency } from '../graphql/types/v2/graphql';
import { VirtualCardLimitInterval } from '../graphql/types/v2/graphql';

const VirtualCardSpendingLimitShortI18n = defineMessages({
  [VirtualCardLimitInterval.DAILY]: {
    id: 'VirtualCardSpendingLimit.Frequency.Day.Short',
    defaultMessage: 'day',
  },
  [VirtualCardLimitInterval.WEEKLY]: {
    id: 'VirtualCardSpendingLimit.Frequency.Week.Short',
    defaultMessage: 'wk',
  },
  [VirtualCardLimitInterval.MONTHLY]: {
    id: 'VirtualCardSpendingLimit.Frequency.Monthly.Short',
    defaultMessage: 'mo',
  },
  [VirtualCardLimitInterval.YEARLY]: {
    id: 'VirtualCardSpendingLimit.Frequency.Yearly.Short',
    defaultMessage: 'yr',
  },
  [VirtualCardLimitInterval.PER_AUTHORIZATION]: {
    id: 'VirtualCardSpendingLimit.Frequency.Authorization.Short',
    defaultMessage: 'auth',
  },
  [VirtualCardLimitInterval.ALL_TIME]: {
    id: 'VirtualCardSpendingLimit.Frequency.AllTime.Short',
    defaultMessage: 'all time',
  },
});

function getSpendingLimitIntervalShortString(intl: IntlShape, spendingLimitInterval: VirtualCardLimitInterval): string {
  return intl.formatMessage(VirtualCardSpendingLimitShortI18n[spendingLimitInterval]);
}

const SpendingLimitShortI18n = defineMessage({
  id: 'VirtualCard.SpendingLimit.Short',
  defaultMessage: `{ spendingLimitInterval, select,
      ALL_TIME {<LimitAmount>{ spendingLimitAmount }</LimitAmount>}
      PER_AUTHORIZATION {<LimitAmount>{ spendingLimitAmount }</LimitAmount><LimitInterval> per use</LimitInterval>}
      other {<LimitAmount>{ spendingLimitAmount }</LimitAmount><LimitInterval>/{ spendingLimitIntervalShort }</LimitInterval>}
    }`,
});

export function getSpendingLimitShortString(
  intl: IntlShape,
  currency: Currency,
  spendingLimitAmount: Amount | number,
  spendingLimitInterval: VirtualCardLimitInterval,
  { LimitAmount = v => v, LimitInterval = v => v } = {},
) {
  return intl.formatMessage(SpendingLimitShortI18n, {
    spendingLimitInterval,
    spendingLimitAmount: formatCurrency(spendingLimitAmount, currency),
    spendingLimitIntervalShort: getSpendingLimitIntervalShortString(intl, spendingLimitInterval),
    LimitAmount,
    LimitInterval,
  });
}

const AvailableLimitShortI18n = defineMessage({
  id: 'VirtualCard.AvailableLimit.Short',
  defaultMessage: `{ spendingLimitInterval, select,
      ALL_TIME {<AvailableAmount>{ availableLimitAmount }</AvailableAmount><AmountSeparator>/</AmountSeparator><LimitAmount>{ spendingLimitAmount }</LimitAmount>}
      PER_AUTHORIZATION {<AvailableAmount>{ spendingLimitAmount }</AvailableAmount><LimitInterval> per use</LimitInterval>}
      other {<AvailableAmount>{ availableLimitAmount }</AvailableAmount><AmountSeparator>/</AmountSeparator><LimitAmount>{ spendingLimitAmount }</LimitAmount><LimitInterval>/{ spendingLimitIntervalShort }</LimitInterval>}
    }`,
});

export function getAvailableLimitShortString(
  intl: IntlShape,
  currency: Currency,
  availableLimitAmount: Amount | number,
  spendingLimitAmount: Amount | number,
  spendingLimitInterval: VirtualCardLimitInterval,
  { AvailableAmount = v => v, AmountSeparator = v => v, LimitAmount = v => v, LimitInterval = v => v } = {},
  options: FormatCurrencyOptions = { precision: 2 },
) {
  return intl.formatMessage(AvailableLimitShortI18n, {
    spendingLimitInterval,
    spendingLimitAmount: formatCurrency(spendingLimitAmount, currency, options),
    availableLimitAmount: formatCurrency(availableLimitAmount, currency, options),
    spendingLimitIntervalShort: getSpendingLimitIntervalShortString(intl, spendingLimitInterval),
    AvailableAmount,
    AmountSeparator,
    LimitAmount,
    LimitInterval,
  });
}

const AvailableLimitI18n = defineMessage({
  id: 'VirtualCard.AvailableLimit',
  defaultMessage: `{ spendingLimitInterval, select,
      ALL_TIME {<AvailableAmount>{ availableLimitAmount }</AvailableAmount><AmountSeparator>/</AmountSeparator><LimitAmount>{ spendingLimitAmount }</LimitAmount>}
      PER_AUTHORIZATION {Limited to <AvailableAmount>{ spendingLimitAmount }</AvailableAmount><LimitInterval> per use</LimitInterval>}
      other {Avl. <AvailableAmount>{ availableLimitAmount }</AvailableAmount> <AmountSeparator>of</AmountSeparator> <LimitAmount>{ spendingLimitAmount }</LimitAmount><LimitInterval>/{ spendingLimitIntervalShort }</LimitInterval>}
    }`,
});

export function getAvailableLimitString(
  intl: IntlShape,
  currency: Currency,
  availableLimitAmount: Amount | number,
  spendingLimitAmount: Amount | number,
  spendingLimitInterval: VirtualCardLimitInterval,
  { AvailableAmount = v => v, AmountSeparator = v => v, LimitAmount = v => v, LimitInterval = v => v } = {},
) {
  return intl.formatMessage(AvailableLimitI18n, {
    spendingLimitInterval,
    spendingLimitAmount: formatCurrency(spendingLimitAmount, currency),
    availableLimitAmount: formatCurrency(availableLimitAmount, currency),
    spendingLimitIntervalShort: getSpendingLimitIntervalShortString(intl, spendingLimitInterval),
    AvailableAmount,
    AmountSeparator,
    LimitAmount,
    LimitInterval,
  });
}
