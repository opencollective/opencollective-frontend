import { z } from 'zod';

// Handles parsing from single value into array
export function isMulti<T>(value: z.ZodType<T, any, any>) {
  const singleValueToArray = value.transform((val: T) => [val]);
  const enumArray = z.array(value);
  return z.union([singleValueToArray, enumArray]);
}

// Use isNullable to allow setting null values in the query filter
export function isNullable(value: z.ZodType<any, any>) {
  return z.union([
    z
      .string()
      .refine(str => str === 'null' || str === '')
      .transform(() => null)
      .pipe(z.null()),
    z.nullable(value),
  ]);
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
