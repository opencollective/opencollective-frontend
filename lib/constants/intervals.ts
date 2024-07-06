import { TierFrequency } from '../graphql/types/v2/graphql';

const INTERVALS = {
  oneTime: 'oneTime',
  month: 'month',
  year: 'year',
  flexible: 'flexible',
} as const;

export const getGQLV2FrequencyFromInterval = (interval: (typeof INTERVALS)[keyof typeof INTERVALS]): TierFrequency => {
  switch (interval) {
    case INTERVALS.month:
      return TierFrequency.MONTHLY;
    case INTERVALS.year:
      return TierFrequency.YEARLY;
    case INTERVALS.flexible:
      return TierFrequency.FLEXIBLE;
    default:
      return TierFrequency.ONETIME;
  }
};

export default INTERVALS;
