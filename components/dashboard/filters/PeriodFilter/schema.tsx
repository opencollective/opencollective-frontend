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

export const schema = z
  .object({
    type: z.nativeEnum(PeriodFilterType),
    gte: SimpleDateString.optional(),
    lte: SimpleDateString.optional(),
    timeUnit: z.nativeEnum(TimeUnit).optional(),
  })

  .default({
    type: PeriodFilterType.LAST_4_WEEKS,
  });
