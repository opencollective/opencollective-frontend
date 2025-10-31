import { z } from 'zod';

// Handles parsing from single value into array
export function isMulti<T>(value: z.ZodType<T, any, any>) {
  const singleValueToArray = value.transform((val: T) => [val]);
  const enumArray = z.array(value);
  return z.union([singleValueToArray, enumArray]);
}

export const integer = z.coerce.number().min(0).int();
export const offset = integer.default(0);
export const limit = integer.default(20);

export const boolean = z.union([
  z
    .string()
    .transform(val => JSON.parse(val))
    .pipe(z.boolean()),
  z.boolean(),
]);

export const SimpleDateString = z.string().regex(/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
