import { defineMessages } from 'react-intl';

import { VirtualCardLimitInterval, VirtualCardStatus } from '../graphql/types/v2/graphql';

export const VirtualCardLimitIntervalDescriptionsI18n = defineMessages({
  [VirtualCardLimitInterval.ALL_TIME]: {
    id: 'virtualCard.intervalLimitDescription.all_time',
    defaultMessage: 'Total amount that can be spent with this card.',
  },
  [VirtualCardLimitInterval.DAILY]: {
    id: 'virtualCard.intervalLimitDescription.daily',
    defaultMessage: 'Daily amount that can be spent with this card.',
  },
  [VirtualCardLimitInterval.MONTHLY]: {
    id: 'virtualCard.intervalLimitDescription.monthly',
    defaultMessage: 'Monthly amount that can be spent with this card.',
  },
  [VirtualCardLimitInterval.PER_AUTHORIZATION]: {
    id: 'virtualCard.intervalLimitDescription.per_authorization',
    defaultMessage: 'Amount that can be spent with this card per use.',
  },
  [VirtualCardLimitInterval.WEEKLY]: {
    id: 'virtualCard.intervalLimitDescription.weekly',
    defaultMessage: 'Weekly amount that can be spent with this card.',
  },
  [VirtualCardLimitInterval.YEARLY]: {
    id: 'virtualCard.intervalLimitDescription.yearly',
    defaultMessage: 'Yearly amount that can be spent with this card.',
  },
});

export const VirtualCardLimitIntervalI18n = defineMessages({
  [VirtualCardLimitInterval.ALL_TIME]: {
    defaultMessage: 'All time',
  },
  [VirtualCardLimitInterval.DAILY]: {
    id: 'virtualCard.intervalLimit.daily',
    defaultMessage: 'Daily',
  },
  [VirtualCardLimitInterval.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [VirtualCardLimitInterval.PER_AUTHORIZATION]: {
    id: 'virtualCard.intervalLimit.per_authorization',
    defaultMessage: 'Per authorization',
  },
  [VirtualCardLimitInterval.WEEKLY]: {
    id: 'week',
    defaultMessage: 'Weekly',
  },
  [VirtualCardLimitInterval.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

export const VirtualCardStatusI18n = defineMessages({
  [VirtualCardStatus.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [VirtualCardStatus.INACTIVE]: {
    id: 'virtualCard.status.inactive',
    defaultMessage: 'Inactive',
  },
  [VirtualCardStatus.CANCELED]: {
    id: 'virtualCard.status.canceled',
    defaultMessage: 'Canceled',
  },
});
