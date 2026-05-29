import { z } from 'zod';

import { ContributionField } from './contributions';
import { Op } from './rules';

function opInValidator(predicate: { operator: Op; value: string | number | string[] }) {
  if (predicate.operator !== Op.in) {
    return true;
  }
  if (!Array.isArray(predicate.value)) {
    return false;
  }
  return predicate.value.length > 0;
}

function opContainsValidator(predicate: { operator: Op; value: string }) {
  if (predicate.operator !== Op.contains) {
    return true;
  }
  return predicate.value.length > 0;
}

export const contributionRulesSchema = z.object({
  rules: z.array(
    z.object({
      name: z.string().min(1),
      predicates: z.array(
        z
          .object({
            subject: z.nativeEnum(ContributionField),
            operator: z.nativeEnum(Op),
            value: z.string().or(z.number()).or(z.array(z.string())),
          })
          .refine(opInValidator, {
            message: 'Required',
            path: ['value'],
          })
          .refine(opContainsValidator, {
            message: 'Required',
            path: ['value'],
          }),
      ),
      categoryId: z.string().refine(
        data => {
          return data.length > 0;
        },
        {
          message: 'Required',
        },
      ),
    }),
  ),
});
