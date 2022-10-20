import { VirtualCardLimitInterval } from '../graphql/types/v2/graphql';

export const VirtualCardMaximumLimitForInterval: { [interval in VirtualCardLimitInterval]: number } = {
  [VirtualCardLimitInterval.PER_AUTHORIZATION]: 5000,
  [VirtualCardLimitInterval.DAILY]: 5000,
  [VirtualCardLimitInterval.WEEKLY]: 5000,
  [VirtualCardLimitInterval.MONTHLY]: 5000,
  [VirtualCardLimitInterval.YEARLY]: 5000,
  [VirtualCardLimitInterval.ALL_TIME]: 5000,
};
