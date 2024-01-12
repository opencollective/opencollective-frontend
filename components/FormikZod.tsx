import React from 'react';
import { Formik, FormikConfig, FormikErrors, FormikValues, useFormik } from 'formik';
import { get, isNil, mapValues, max, merge, set, xor } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';
import { z, ZodEffects, ZodIssue, ZodNullable, ZodOptional, ZodTypeAny } from 'zod';

import { RICH_ERROR_MESSAGES } from '../lib/form-utils';

/**
 * Attributes that can be set on an input element, inferred from a Zod schema.
 */
type InputAttributesFromZodSchema = {
  name?: string;
  required?: boolean;
} & (
  | {}
  | {
      type: 'text';
      minLength?: number;
      maxLength?: number;
    }
  | {
      type: 'number';
      min?: number;
      max?: number;
    }
);

/**
 * A Zod schema that can be used in a Formik form. It can be a plain Zod object or a Zod effect that wraps a Zod object.
 */
type SupportedZodSchema<Values = any> = z.ZodSchema<Values> | ZodEffects<z.ZodSchema<Values>>;

/**
 * Some global configuration for the FormikZod component.
 */
type FormikZodConfig = {
  /** Whether to show "(required)" on all `StyledInputFormikField` labels. */
  useRequiredLabel?: boolean;
  requiredIndicator?: 'label' | '*';
  /** Whether hints should appear above or below the input. Defaults to below. */
  hintPosition?: 'above' | 'below';
};

/**
 * @returns a Zod error map that uses the provided `intl` object to internationalize the error messages.
 */
export const getCustomZodErrorMap =
  (intl: IntlShape) =>
  (error: ZodIssue, ctx: { defaultError: string; data: any }): { message: string } => {
    if (error.message && error.message !== ctx.defaultError) {
      return { message: error.message }; // If a custom message was provided, use it
    }

    let message = error.message;
    if (error.code === 'too_big') {
      message =
        error.type === 'number'
          ? intl.formatMessage(RICH_ERROR_MESSAGES.max, { max: error.maximum as number })
          : intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: error.maximum as number });
    } else if (error.code === 'too_small') {
      message =
        error.type === 'number'
          ? intl.formatMessage(RICH_ERROR_MESSAGES.min, { min: error.minimum as number })
          : intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: error.minimum as number });
    } else if (error.code === 'invalid_string') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.format);
    } else if (error.code === 'invalid_enum_value') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.enum, { options: error.options.join(', ') });
    } else if (error.code === 'invalid_type') {
      const value = get(ctx.data, error.path);
      if (value === undefined || value === null) {
        message = intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue);
      }
    } else if (error.code === 'invalid_literal') {
      if (error.expected === true) {
        message = intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue);
      }
    } else if (error.code === 'invalid_union_discriminator' && xor(error.options, [true, false]).length === 0) {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue);
    }

    return { message: message || intl.formatMessage(RICH_ERROR_MESSAGES.invalidValue) };
  };

function isZodType<T extends ZodTypeAny>(v: any, typeKind: z.ZodFirstPartyTypeKind): v is T {
  if ('typeName' in v._def) {
    return v._def.typeName === typeKind;
  }

  return false;
}

/**
 * @returns A function that can be used as a Formik `validate` function for a Zod schema. The function will
 * check the values against the Zod schema and return an object of internationalized error messages.
 */
function getErrorsObjectFromZodSchema<Values>(
  intl: IntlShape,
  zodSchema: z.ZodSchema<Values>,
  values: Values,
): FormikErrors<Values> {
  const errors = {};
  const result = zodSchema.safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
  if (!result.success) {
    const errorResult = result as z.SafeParseError<typeof values>;
    for (const error of errorResult.error.issues) {
      if (!get(errors, error.path)) {
        set(errors, error.path, error.message);
      }
    }
  }

  return errors;
}

export const getAllFieldsFromZodSchema = (schema): string[] => {
  if (isZodType<z.ZodObject<any>>(schema, z.ZodFirstPartyTypeKind.ZodObject)) {
    return Object.keys(schema.shape);
  } else if (isZodType<z.ZodIntersection<any, any>>(schema, z.ZodFirstPartyTypeKind.ZodIntersection)) {
    return [...getAllFieldsFromZodSchema(schema._def.left), ...getAllFieldsFromZodSchema(schema._def.right)];
  } else if (isZodType<z.ZodUnion<any>>(schema, z.ZodFirstPartyTypeKind.ZodUnion)) {
    return schema.options.flatMap(option => getAllFieldsFromZodSchema(option));
  } else {
    return [];
  }
};

const isOptionalField = (field: z.ZodTypeAny): field is ZodOptional<any> | ZodNullable<any> => {
  return ['ZodOptional', 'ZodNullable'].includes(field._def.typeName);
};

const getTypeFromOptionalField = (field: z.ZodTypeAny): z.ZodTypeAny => {
  if (isOptionalField(field)) {
    return getTypeFromOptionalField(field.unwrap());
  } else {
    return field;
  }
};

const getStringOptionFromUnion = (field: z.ZodTypeAny): z.ZodString | undefined => {
  for (const option of field._def.options) {
    const type = getTypeFromOptionalField(option);
    if (isZodType<z.ZodString>(type, z.ZodFirstPartyTypeKind.ZodString)) {
      return type as z.ZodString;
    }
  }
};

/**
 * Retrieves the given nested field from a Zod schema.
 */
const getNestedFieldFromSchema = (
  schema: z.ZodTypeAny,
  fullPath: string[],
  isOptional = false,
): { field: z.ZodTypeAny; isOptional: boolean } => {
  if (isZodType<z.ZodObject<any>>(schema, z.ZodFirstPartyTypeKind.ZodObject)) {
    const [path, ...subPath] = fullPath;
    const field = (schema as z.AnyZodObject).shape[path];
    if (!field || subPath.length === 0) {
      return { field, isOptional };
    } else if (isOptionalField(field)) {
      const mainField = getTypeFromOptionalField(field); // Make sure we properly traverse optional parents
      return getNestedFieldFromSchema(mainField, subPath, true);
    } else {
      return getNestedFieldFromSchema(field, subPath, isOptional);
    }
  } else if (isZodType<z.ZodEffects<any>>(schema, z.ZodFirstPartyTypeKind.ZodEffects)) {
    return getNestedFieldFromSchema(schema._def.schema, fullPath, isOptional);
  } else if (isZodType<z.ZodIntersection<any, any>>(schema, z.ZodFirstPartyTypeKind.ZodIntersection)) {
    const { left, right } = schema._def;
    const leftResult = getNestedFieldFromSchema(left, fullPath, isOptional);
    if (leftResult.field) {
      return leftResult;
    }

    return getNestedFieldFromSchema(right, fullPath, isOptional);
  }

  return { field: null, isOptional };
};

export const generateInitialValuesFromSchema = (schema: z.ZodTypeAny): any => {
  if (!schema) {
    return null;
  } else if (isOptionalField(schema)) {
    const field = getTypeFromOptionalField(schema);
    return generateInitialValuesFromSchema(field);
  } else if (isZodType<z.ZodObject<any>>(schema, z.ZodFirstPartyTypeKind.ZodObject)) {
    return mapValues(schema.shape, generateInitialValuesFromSchema);
  } else if (isZodType<z.ZodUnion<any>>(schema, z.ZodFirstPartyTypeKind.ZodUnion)) {
    for (const option of schema.options) {
      const value = generateInitialValuesFromSchema(option);
      if (value !== null) {
        return value;
      }
    }

    return null;
  } else if (isZodType<z.ZodEffects<any>>(schema, z.ZodFirstPartyTypeKind.ZodEffects)) {
    return generateInitialValuesFromSchema(schema._def.schema);
  } else if (isZodType<z.ZodIntersection<any, any>>(schema, z.ZodFirstPartyTypeKind.ZodIntersection)) {
    return merge(generateInitialValuesFromSchema(schema._def.left), generateInitialValuesFromSchema(schema._def.right));
  } else if (isZodType<z.ZodArray<any>>(schema, z.ZodFirstPartyTypeKind.ZodArray)) {
    return [];
  } else if (isZodType<z.ZodString>(schema, z.ZodFirstPartyTypeKind.ZodString)) {
    return '';
  } else if (isZodType(schema, z.ZodFirstPartyTypeKind.ZodDefault)) {
    return schema._def.defaultValue();
  } else {
    return null;
  }
};

/**
 * @param name a dot-separated path to the field in the schema.
 * @returns the attributes that should be set on an input element.
 */
export const getInputAttributesFromZodSchema = (
  schema: SupportedZodSchema,
  name: string,
): InputAttributesFromZodSchema => {
  if (!schema) {
    return {};
  }

  const nestedFieldInfo = getNestedFieldFromSchema(schema, name.split('.'));
  if (!nestedFieldInfo.field) {
    return {};
  }

  let { field } = nestedFieldInfo;
  const attributes = { name, required: true };

  // Handle optional/required
  if (nestedFieldInfo.isOptional || isOptionalField(field)) {
    attributes.required = false;
    field = getTypeFromOptionalField(field);
  } else if (field._def.typeName === 'ZodUnion') {
    // If any of the options is optional, the field is optional
    attributes.required = !field._def.options.some(option => isOptionalField(option));

    // It's common to have an union between a string and a literal(''), to allow empty strings while enforcing a minimum length.
    // In this case, we should use the string's attributes.
    const stringOption = getStringOptionFromUnion(field);
    if (stringOption) {
      field = stringOption;
    }
  }

  // Handle type-specific attributes
  if (isZodType<z.ZodString>(field, z.ZodFirstPartyTypeKind.ZodString)) {
    attributes['type'] = 'text';
    if (!isNil(field.minLength)) {
      attributes['minLength'] = field.minLength;
    }
    if (!isNil(field.maxLength)) {
      attributes['maxLength'] = field.maxLength;
    }
  } else if (isZodType<z.ZodNumber>(field, z.ZodFirstPartyTypeKind.ZodNumber)) {
    attributes['type'] = 'number';
    const minChecks = field._def.checks
      .filter((check): check is z.ZodNumberCheck & { kind: 'min' } => check.kind === 'min')
      .map(check => check.value);
    const minValue = max(minChecks); // Get the least restrictive minimum
    if (!isNil(minValue)) {
      attributes['min'] = minValue;
    }

    const maxChecks = field._def.checks
      .filter((check): check is z.ZodNumberCheck & { kind: 'max' } => check.kind === 'max')
      .map(check => check.value);
    const maxValue = max(maxChecks); // Get the most restrictive maximum
    if (!isNil(maxValue)) {
      attributes['max'] = maxValue;
    }
  }

  return attributes;
};

export const FormikZodContext = React.createContext<{
  schema: SupportedZodSchema | null;
  config: FormikZodConfig | null;
}>({
  schema: null,
  config: null,
});

/**
 * A wrapper around `useFormik` that plugs in Zod validation.
 *
 * @warning In [their docs](https://formik.org/docs/api/useFormik), Formik discourages using `useFormik` directly. This
 * component will not work out of the box with `StyledInputFormikField` and other components that rely on Formik context such as `Field` or `FastField`.
 * If you are trying to access Formik state via context, use `useFormikContext`. Only use this hook if you are NOT using <Formik> or withFormik.
 */
export function useFormikZod<Values extends FormikValues = FormikValues>({
  schema,
  ...props
}: Omit<FormikConfig<Values>, 'initialStatus' | 'validate'> & {
  schema: SupportedZodSchema<Values>;
  config?: FormikZodConfig;
}) {
  const intl = useIntl();
  const validate = React.useCallback(
    values => getErrorsObjectFromZodSchema<Values>(intl, schema, values),
    [intl, schema],
  );
  return useFormik<Values>({ ...props, validate });
}

/**
 * A wrapper around `Formik` that plugs in Zod validation.
 *
 * Combined with `StyledInputFormikField` this components provides a simple way to have automatic
 * form validation and HTML best practices (e.g. setting the `required` and HTML validation attributes).
 */
export function FormikZod<Values extends FormikValues = FormikValues>({
  schema,
  config,
  ...props
}: Omit<React.ComponentProps<typeof Formik<Values>>, 'initialStatus' | 'validate' | 'render'> & {
  schema: SupportedZodSchema<Values>;
  config?: FormikZodConfig;
}) {
  const FormikWrapper = Formik<Values>;
  const intl = useIntl();
  const context = React.useMemo(() => ({ schema, config }), [schema, config]);
  const validate = React.useCallback(
    values => getErrorsObjectFromZodSchema<Values>(intl, schema, values),
    [intl, schema],
  );
  return (
    <FormikZodContext.Provider value={context}>
      <FormikWrapper {...props} validate={validate} />
    </FormikZodContext.Provider>
  );
}

// ignore unused exports useFormikZod, FormikZod, getInputAttributesFromZodSchema
