import dayjs from 'dayjs';
import { z } from 'zod';

import { SimpleDateString } from '../../../../lib/filters/schemas';

export enum DateFilterType {
  IN_LAST_PERIOD = 'IN_LAST_PERIOD',
  EQUAL_TO = 'EQUAL_TO',
  BETWEEN = 'BETWEEN',
  AFTER = 'AFTER',
  ON_OR_AFTER = 'ON_OR_AFTER',
  BEFORE = 'BEFORE',
  BEFORE_OR_ON = 'BEFORE_OR_ON',
}

const { IN_LAST_PERIOD, EQUAL_TO, BETWEEN, AFTER, ON_OR_AFTER, BEFORE, BEFORE_OR_ON } = DateFilterType;

const BaseDate = z.object({
  tz: z.enum(['local', 'UTC']).optional(),
});

const InBetweenDate = BaseDate.extend({
  type: z.literal(BETWEEN).default(BETWEEN),
  gte: SimpleDateString,
  lte: SimpleDateString,
});

const LegacyPeriod = z
  .string()
  .regex(/^(?<from>[^→]+)(→(?<to>.+?(?=~UTC|$)))?(~(?<timezoneType>UTC))?$/)
  .transform(str => {
    const parsedValue = str?.match(/^(?<from>[^→]+)(→(?<to>.+?(?=~UTC|$)))?(~(?<timezoneType>UTC))?$/);
    if (parsedValue) {
      const getDateIsoString = dateStr => (!dateStr || dateStr === 'all' ? undefined : dateStr);
      const tz = parsedValue.groups.timezoneType === 'UTC' ? 'UTC' : 'local';

      return {
        gte: getDateIsoString(parsedValue.groups.from),
        lte: getDateIsoString(parsedValue.groups.to),
        tz,
        type: BETWEEN,
      };
    } else {
      return z.NEVER;
    }
  });

export enum Period {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}

export const dateFilterSchema = z
  .union([
    LegacyPeriod.pipe(InBetweenDate),
    BaseDate.extend({
      type: z.literal(IN_LAST_PERIOD).default(IN_LAST_PERIOD),
      number: z.coerce.number().int().positive(),
      period: z.nativeEnum(Period),
    }),
    BaseDate.extend({
      type: z.literal(EQUAL_TO).default(EQUAL_TO),
      gte: SimpleDateString,
      lte: SimpleDateString,
    }).refine(({ gte, lte }) => gte === lte),
    InBetweenDate,
    BaseDate.extend({
      type: z.literal(AFTER).default(AFTER),
      gt: SimpleDateString,
    }),
    BaseDate.extend({
      type: z.literal(ON_OR_AFTER).default(ON_OR_AFTER),
      gte: SimpleDateString,
    }),
    BaseDate.extend({
      type: z.literal(BEFORE).default(BEFORE),
      lt: SimpleDateString,
    }),
    BaseDate.extend({
      type: z.literal(BEFORE_OR_ON).default(BEFORE_OR_ON),
      lte: SimpleDateString,
    }),
  ])
  .optional()
  .catch(undefined);

export type DateFilterValueType = z.infer<typeof dateFilterSchema>;

export function dateToVariables(value: z.infer<typeof dateFilterSchema>, fieldPrefix = 'date') {
  const dayjsWithTz = value.tz === 'UTC' ? dayjs.utc : dayjs;

  switch (value.type) {
    case DateFilterType.IN_LAST_PERIOD:
      return {
        [`${fieldPrefix}From`]: dayjsWithTz().startOf('day').subtract(value.number, value.period).toISOString(),
      };
    case DateFilterType.EQUAL_TO:
    case DateFilterType.BETWEEN:
      return {
        [`${fieldPrefix}From`]: dayjsWithTz(value.gte).startOf('day').toISOString(),
        [`${fieldPrefix}To`]: dayjsWithTz(value.lte).endOf('day').toISOString(),
      };
    case DateFilterType.AFTER:
      return {
        [`${fieldPrefix}From`]: dayjsWithTz(value.gt).endOf('day').toISOString(),
      };
    case DateFilterType.ON_OR_AFTER:
      return {
        [`${fieldPrefix}From`]: dayjsWithTz(value.gte).startOf('day').toISOString(),
      };
    case DateFilterType.BEFORE:
      return {
        [`${fieldPrefix}To`]: dayjsWithTz(value.lt).startOf('day').toISOString(),
      };
    case DateFilterType.BEFORE_OR_ON:
      return {
        [`${fieldPrefix}To`]: dayjsWithTz(value.lte).endOf('day').toISOString(),
      };
  }
}
