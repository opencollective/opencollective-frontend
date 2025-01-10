import { TierFrequency } from '../graphql/types/v2/schema';

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

export function getIntervalFromGQLV2Frequency(frequency: TierFrequency) {
  switch (frequency) {
    case TierFrequency.MONTHLY:
      return INTERVALS.month;
    case TierFrequency.YEARLY:
      return INTERVALS.year;
    case TierFrequency.FLEXIBLE:
      return INTERVALS.flexible;
    default:
      return INTERVALS.oneTime;
  }
}

export default INTERVALS;
