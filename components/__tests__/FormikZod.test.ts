import { z } from 'zod';

import { getInputAttributesFromZodSchema } from '../FormikZod';

describe('FormikZod', () => {
  describe('getInputAttributesFromZodSchema', () => {
    const schema = z.object({
      name: z.string().min(100).max(100),
      optionalName: z.string().optional().nullable(),
      age: z.number().int().positive().min(18).max(99),
      deep: z
        .object({ nested: z.object({ field: z.string().max(500).optional().nullable() }) })
        .optional()
        .nullable(),
    });

    it('gets the attributes for a string field', () => {
      expect(getInputAttributesFromZodSchema(schema, 'name')).toEqual({
        name: 'name',
        maxLength: 100,
        minLength: 100,
        type: 'text',
        required: true,
      });
    });

    it('gets the attributes for an optional string field', () => {
      expect(getInputAttributesFromZodSchema(schema, 'optionalName')).toEqual({
        name: 'optionalName',
        type: 'text',
        required: false,
      });
    });

    it('gets the attributes for a number field', () => {
      expect(getInputAttributesFromZodSchema(schema, 'age')).toEqual({
        name: 'age',
        type: 'number',
        required: true,
        min: 18,
        max: 99,
      });
    });

    it('gets the attributes for a nested field', () => {
      expect(getInputAttributesFromZodSchema(schema, 'deep.nested.field')).toEqual({
        name: 'deep.nested.field',
        type: 'text',
        required: false,
        maxLength: 500,
      });
    });

    it('works with ZodEffects', () => {
      const schemaWithEffects = schema.superRefine(() => {}).superRefine(() => {});
      expect(getInputAttributesFromZodSchema(schemaWithEffects, 'name')).toEqual({
        name: 'name',
        maxLength: 100,
        minLength: 100,
        type: 'text',
        required: true,
      });
    });
  });
});
