import React from 'react';
import {
  Formik,
  FormikConfig,
  FormikErrors,
  FormikProps,
  FormikState,
  FormikValues,
  isEmptyChildren,
  useFormik,
} from 'formik';
import { get, isFunction, isNil, max, set } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';
import { z, ZodEffects, ZodIssue, ZodNullable, ZodObject, ZodOptional, ZodTypeAny } from 'zod';

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
      message = intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: error.maximum as number });
    } else if (error.code === 'too_small') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: error.minimum as number });
    } else if (error.code === 'invalid_string') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.format);
    } else if (error.code === 'invalid_enum_value') {
      message = intl.formatMessage(RICH_ERROR_MESSAGES.enum, { options: error.options.join(', ') });
    } else if (error.code === 'invalid_type') {
      const value = get(ctx.data, error.path);
      if (value === undefined || value === null) {
        message = intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue);
      }
    }

    return { message: message || intl.formatMessage(RICH_ERROR_MESSAGES.invalidValue) };
  };

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

function isZodType<T extends ZodTypeAny>(v: any, typeKind: z.ZodFirstPartyTypeKind): v is T {
  if ('typeName' in v._def) {
    return v._def.typeName === typeKind;
  }

  return false;
}

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

interface FormikStatusWithSchema {
  schema: SupportedZodSchema;
}

interface FormikWithSchema<Values> extends FormikState<Values> {
  status: FormikStatusWithSchema;
}

function isFormikWithSchema<T>(formik: FormikState<T>): formik is FormikWithSchema<T> {
  if (formik.status && 'schema' in formik.status) {
    return formik.status.schema instanceof ZodObject || formik.status.schema instanceof ZodEffects;
  }

  return false;
}

/**
 * @returns the Zod schema from a Formik form (if defined)
 */
export function getSchemaFromFormik(formik: FormikState<any>): SupportedZodSchema | undefined {
  if (isFormikWithSchema(formik)) {
    return formik.status.schema;
  }
}

/**
 * A helper to create the status and validate functions (memoized).
 */
function useFormikZodState<Values extends FormikValues = FormikValues>(schema: z.ZodSchema<Values>) {
  const intl = useIntl();
  const status: FormikStatusWithSchema = React.useMemo(() => ({ schema }), [schema]);
  const validate = React.useCallback(
    values => getErrorsObjectFromZodSchema<Values>(intl, schema, values),
    [intl, schema],
  );

  return { validate, status };
}

/**
 * Formik doesn't let us control the value of `status` directly, so we need to use a side effect to update it.
 */
function useFormikZodStatusUpdater<Values extends FormikValues = FormikValues>(
  formik: FormikProps<Values>,
  status: FormikStatusWithSchema,
) {
  React.useEffect(() => {
    if (status !== formik.status) {
      formik.setStatus(status);
    }
  }, [status]);
}

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
}) {
  const { validate, status } = useFormikZodState(schema);
  const formik = useFormik<Values>({ ...props, initialStatus: status, validate });
  useFormikZodStatusUpdater(formik, status);
  return formik;
}

/**
 * A component meant to plug `useFormikZodStatusUpdater` before rendering children, to make sure the Zod schema
 * stays up to date.
 */
function FormikZodStatusHandler<Values extends FormikValues = FormikValues>({
  formik,
  status,
  component,
  children,
}: {
  formik: FormikProps<Values>;
  status: FormikStatusWithSchema;
  component?: React.ComponentType<FormikProps<Values>>;
  children?: React.ReactNode | ((bag: FormikProps<Values>) => React.ReactNode);
}) {
  useFormikZodStatusUpdater(formik, status);
  return component
    ? React.createElement(component as any, formik)
    : children
      ? isFunction(children)
        ? (children as (bag: FormikProps<Values>) => React.ReactNode)(formik as FormikProps<Values>)
        : !isEmptyChildren(children)
          ? React.Children.only(children)
          : null
      : null;
}

/**
 * A wrapper around `Formik` that plugs in Zod validation.
 *
 * Combined with `StyledInputFormikField` this components provides a simple way to have automatic
 * form validation and HTML best practices (e.g. setting the `required` and HTML validation attributes).
 */
export function FormikZod<Values extends FormikValues = FormikValues>({
  schema,
  component,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Formik<Values>>, 'initialStatus' | 'validate' | 'render'> & {
  schema: SupportedZodSchema<Values>;
}) {
  const { validate, status } = useFormikZodState(schema);
  const FormikWrapper = Formik<Values>;
  return (
    <FormikWrapper {...props} initialStatus={status} validate={validate}>
      {/* eslint-disable-next-line react/no-children-prop */}
      {formik => <FormikZodStatusHandler formik={formik} status={status} component={component} children={children} />}
    </FormikWrapper>
  );
}

// ignore unused exports useFormikZod, FormikZod, getInputAttributesFromZodSchema
