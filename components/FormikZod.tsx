import React from 'react';
import { Formik, FormikConfig, FormikValues, useFormik } from 'formik';
import { get, isNil, max, set } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';
import { z, ZodEffects, ZodIssue, ZodObject } from 'zod';

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
type AcceptedZodSchema = z.AnyZodObject | ZodEffects<z.AnyZodObject>;

/**
 * @returns a Zod error map that uses the provided `intl` object to internationalize the error messages.
 */
const getCustomZodErrorMap =
  (intl: IntlShape) =>
  (error: ZodIssue, ctx: { defaultError: string; data: any }): { message: string } => {
    if (error.message && error.message !== ctx.defaultError) {
      return { message: error.message }; // If a custom message was provided, use it
    }

    let message = error.message;
    if (error.code === 'too_big') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: error.maximum as number });
    } else if (error.code === 'too_small') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: error.minimum as number });
    } else if (error.code === 'invalid_string') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.format);
    } else if (error.code === 'invalid_enum_value') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.enum, { options: error.options.join(', ') });
    }

    return { message: message || intl.formatMessage(RICH_ERROR_MESSAGES.invalidValue) };
  };

/**
 * @returns A function that can be used as a Formik `validate` function for a Zod schema. The function will
 * check the values against the Zod schema and return an object of internationalized error messages.
 */
const getErrorsObjectFromZodSchema = (
  intl: IntlShape,
  zodSchema: AcceptedZodSchema,
  values: z.infer<typeof zodSchema>,
): Record<string, string> => {
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
};

const isOptionalField = (field: z.ZodTypeAny): boolean => {
  return ['ZodOptional', 'ZodNullable'].includes(field._def.typeName);
};

const getTypeFromOptionalField = (field: z.ZodTypeAny): z.ZodTypeAny => {
  if (isOptionalField(field)) {
    return getTypeFromOptionalField(field._def['innerType']);
  } else {
    return field;
  }
};

const getStringOptionFromUnion = (field: z.ZodTypeAny): z.ZodString | undefined => {
  for (const option of field._def.options) {
    const type = getTypeFromOptionalField(option);
    if (type._def.typeName === 'ZodString') {
      return type as z.ZodString;
    }
  }
};

/**
 * Retrieves the given nested field from a Zod schema.
 */
const getNestedFieldFromSchema = (schema: z.ZodTypeAny, fullPath: string[]): z.ZodTypeAny => {
  if (schema._def.typeName === 'ZodObject') {
    const [path, ...subPath] = fullPath;
    const field = (schema as z.AnyZodObject).shape[path];
    if (!field || subPath.length === 0) {
      return field;
    } else {
      const mainField = getTypeFromOptionalField(field); // Make sure we properly traverse optional parents
      return getNestedFieldFromSchema(mainField, subPath);
    }
  } else if (schema._def.typeName === 'ZodEffects') {
    return getNestedFieldFromSchema(schema._def.schema, fullPath);
  }

  return null;
};

/**
 * @param name a dot-separated path to the field in the schema.
 * @returns the attributes that should be set on an input element.
 */
export const getInputAttributesFromZodSchema = (
  schema: AcceptedZodSchema,
  name: string,
): InputAttributesFromZodSchema => {
  if (!schema) {
    return {};
  }

  let field = getNestedFieldFromSchema(schema, name.split('.'));
  if (!field) {
    return {};
  }

  const attributes = { name, required: true };

  // Handle optional/required
  if (isOptionalField(field)) {
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
  if (field._def.typeName === 'ZodString') {
    attributes['type'] = 'text';
    if (!isNil(field['minLength'])) {
      attributes['minLength'] = field['minLength'];
    }
    if (!isNil(field['maxLength'])) {
      attributes['maxLength'] = field['maxLength'];
    }
  } else if (field._def.typeName === 'ZodNumber') {
    attributes['type'] = 'number';
    const minChecks = field._def.checks.filter(check => check.kind === 'min').map(check => check.value);
    const minValue = max(minChecks); // Get the least restrictive minimum
    if (!isNil(minValue)) {
      attributes['min'] = minValue;
    }

    const maxChecks = field._def.checks.filter(check => check.kind === 'max').map(check => check.value);
    const maxValue = max(maxChecks); // Get the most restrictive maximum
    if (!isNil(maxValue)) {
      attributes['max'] = maxValue;
    }
  }

  return attributes;
};

/**
 * @returns the Zod schema from a Formik form (if defined)
 */
export const getSchemaFromFormik = (formik: FormikValues): AcceptedZodSchema | undefined => {
  if (formik.status && (formik.status instanceof ZodObject || formik.status instanceof ZodEffects)) {
    return formik.status;
  }
};

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
}: Omit<FormikConfig<Values>, 'initialValues' | 'validate' | 'initialValues'> & {
  schema: AcceptedZodSchema;
  initialValues: z.infer<typeof schema> & Values;
}) {
  const intl = useIntl();
  const validate = React.useCallback(values => getErrorsObjectFromZodSchema(intl, schema, values), [intl, schema]);
  return useFormik<Values>({ ...props, validate, initialStatus: schema });
}

/**
 * A wrapper around `Formik` that plugs in Zod validation.
 *
 * Combined with `StyledInputFormikField` this components provides a simple way to have automatic
 * form validation and HTML best practices (e.g. setting the `required` and HTML validation attributes).
 */
export const FormikZod = ({
  schema,
  ...props
}: Omit<React.ComponentProps<typeof Formik>, 'initialStatus' | 'validate' | 'initialValues'> & {
  schema: AcceptedZodSchema;
  initialValues: z.infer<typeof schema>;
}) => {
  const intl = useIntl();
  const validate = React.useCallback(values => getErrorsObjectFromZodSchema(intl, schema, values), [intl, schema]);
  return <Formik initialStatus={schema} validate={validate} {...props} />;
};

// ignore unused exports useFormikZod, FormikZod, getInputAttributesFromZodSchema
