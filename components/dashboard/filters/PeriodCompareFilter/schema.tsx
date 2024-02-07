import { z } from 'zod';

import { SimpleDateString } from '../../../../lib/filters/schemas';
import { TimeUnit } from '../../../../lib/graphql/types/v2/graphql';

export enum PeriodFilterType {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_4_WEEKS = 'LAST_4_WEEKS',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_12_MONTHS = 'LAST_12_MONTHS',
  MONTH_TO_DATE = 'MONTH_TO_DATE',
  QUARTER_TO_DATE = 'QUARTER_TO_DATE',
  YEAR_TO_DATE = 'YEAR_TO_DATE',
  ALL_TIME = 'ALL_TIME',
  CUSTOM = 'CUSTOM',
}

export enum PeriodFilterCompare {
  PREVIOUS_PERIOD = 'PREVIOUS_PERIOD',
  PREVIOUS_MONTH = 'PREVIOUS_MONTH',
  PREVIOUS_QUARTER = 'PREVIOUS_QUARTER',
  PREVIOUS_YEAR = 'PREVIOUS_YEAR',
  NO_COMPARISON = 'NO_COMPARISON',
}

const defaultTimeUnitPerPeriodType = {
  [PeriodFilterType.TODAY]: TimeUnit.HOUR,
  [PeriodFilterType.LAST_7_DAYS]: TimeUnit.DAY,
  [PeriodFilterType.LAST_4_WEEKS]: TimeUnit.WEEK,
  [PeriodFilterType.LAST_3_MONTHS]: TimeUnit.MONTH,
  [PeriodFilterType.LAST_12_MONTHS]: TimeUnit.MONTH,
  [PeriodFilterType.MONTH_TO_DATE]: TimeUnit.DAY,
  [PeriodFilterType.QUARTER_TO_DATE]: TimeUnit.DAY,
  [PeriodFilterType.YEAR_TO_DATE]: TimeUnit.MONTH,
  [PeriodFilterType.ALL_TIME]: TimeUnit.MONTH,
  [PeriodFilterType.CUSTOM]: TimeUnit.DAY,
};

export const schema = z
  .object({
    type: z.nativeEnum(PeriodFilterType),
    gte: SimpleDateString.optional(),
    lte: SimpleDateString.optional(),
    compare: z.nativeEnum(PeriodFilterCompare).optional(),
    timeUnit: z.nativeEnum(TimeUnit).optional(),
  })
  .transform(value => {
    if (!value.timeUnit) {
      value.timeUnit = defaultTimeUnitPerPeriodType[value.type];
    }

    // set comparison period
    if (!value.compare) {
      switch (value.type) {
        case PeriodFilterType.MONTH_TO_DATE:
          value.compare = PeriodFilterCompare.PREVIOUS_MONTH;
          break;
        case PeriodFilterType.QUARTER_TO_DATE:
          value.compare = PeriodFilterCompare.PREVIOUS_QUARTER;
          break;
        case PeriodFilterType.YEAR_TO_DATE:
          value.compare = PeriodFilterCompare.PREVIOUS_YEAR;
          break;
        default:
          value.compare = PeriodFilterCompare.PREVIOUS_PERIOD;
          break;
      }
    }
    return value;
  })
  .default({
    type: PeriodFilterType.LAST_3_MONTHS,
    compare: PeriodFilterCompare.PREVIOUS_PERIOD,
    timeUnit: TimeUnit.MONTH,
  });
