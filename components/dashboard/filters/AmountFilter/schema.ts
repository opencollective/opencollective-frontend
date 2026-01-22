import { z } from 'zod';

import type { Currency } from '@/lib/graphql/types/v2/schema';

export enum AmountFilterType {
  IS_EQUAL_TO = 'IS_EQUAL_TO',
  IS_BETWEEN = 'IS_BETWEEN',
  IS_GREATER_THAN = 'IS_GREATER_THAN',
  IS_LESS_THAN = 'IS_LESS_THAN',
}

const { IS_EQUAL_TO, IS_BETWEEN, IS_GREATER_THAN, IS_LESS_THAN } = AmountFilterType;

const amountFilter = z.union([
  z
    .object({
      type: z.literal(IS_EQUAL_TO).default(IS_EQUAL_TO),
      gte: z.coerce.number().int(),
      lte: z.coerce.number().int(),
      currency: z
        .string()
        .optional()
        .transform(str => str as Currency),
    })
    .refine(({ gte, lte }) => gte === lte),
  z.object({
    type: z.literal(IS_BETWEEN).default(IS_BETWEEN),
    gte: z.coerce.number().int(),
    lte: z.coerce.number().int(),
    currency: z
      .string()
      .optional()
      .transform(str => str as Currency),
  }),
  z.object({
    type: z.literal(IS_GREATER_THAN).default(IS_GREATER_THAN),
    gte: z.coerce.number().int(),
    currency: z
      .string()
      .optional()
      .transform(str => str as Currency),
  }),
  z.object({
    type: z.literal(IS_LESS_THAN).default(IS_LESS_THAN),
    lte: z.coerce.number().int(),
    currency: z
      .string()
      .optional()
      .transform(str => str as Currency),
  }),
]);

const LegacyParser = z
  .string()
  .transform(str => {
    if (!str || str.length === 0) {
      return null;
    }

    if (str.includes('+')) {
      const [gte] = str.split('+');

      return {
        gte: Number(gte) * 100,
      };
    }

    if (str.includes('-')) {
      const [gte, lte] = str.split('-');

      return {
        gte: Number(gte) * 100,
        lte: Number(lte) * 100,
      };
    }
    return {
      gte: Number(str) * 100,
      lte: Number(str) * 100,
    };
  })
  .pipe(amountFilter);

export const amountFilterSchema = z.union([LegacyParser, amountFilter]).optional().catch(undefined);
export type AmountFilterValueType = z.infer<typeof amountFilterSchema>;
