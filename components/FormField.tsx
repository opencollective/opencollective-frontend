import React, { useContext } from 'react';
import type { FormikProps } from 'formik';
import { Field } from 'formik';
import { pickBy } from 'lodash';
import { useIntl } from 'react-intl';

import { isOCError } from '../lib/errors';
import { formatFormErrorMessage, RICH_ERROR_MESSAGES } from '../lib/form-utils';

import PrivateInfoIcon from './icons/PrivateInfoIcon';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { FormikZodContext, getInputAttributesFromZodSchema } from './FormikZod';

export function FormField({
  label,
  showError = true,
  name,
  hint,
  placeholder,
  children,
  error: customError,
  isPrivate,
  ...props
}: {
  label?: string;
  showError?: boolean;
  name: string;
  hint?: string;
  placeholder?: string;
  children?: (props: { form: FormikProps<any>; meta: any; field: any; hasError?: boolean }) => JSX.Element;
  required?: boolean;
  min?: number;
  max?: number;
  inputType?: string;
  disabled?: boolean;
  htmlFor?: string;
  error?: string;
  isPrivate?: boolean;
}) {
  const intl = useIntl();
  const htmlFor = props.htmlFor || `input-${name}`;
  const { schema } = useContext(FormikZodContext);

  return (
    <Field name={name}>
      {({ field, form, meta }) => {
        const hasError = Boolean(meta.error && (meta.touched || form.submitCount)) || Boolean(customError);
        const error = customError || meta.error;

        const fieldAttributes = {
          ...(schema ? getInputAttributesFromZodSchema(schema, name) : null),
          ...pickBy(
            {
              ...field,
              name: name || htmlFor,
              id: htmlFor,
              type: props.inputType,
              disabled: props.disabled,
              min: props.min,
              max: props.max,
              required: props.required,
              error: hasError,
              placeholder,
            },
            value => value !== undefined,
          ),
        };
        if (
          'required' in fieldAttributes &&
          !fieldAttributes.required &&
          meta.error &&
          meta.error === intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue)
        ) {
          fieldAttributes.required = true;
        }
        return (
          <div className="flex w-full flex-col gap-1">
            {label && (
              <Label className="leading-normal">
                {label}
                {isPrivate && (
                  <React.Fragment>
                    &nbsp;
                    <PrivateInfoIcon />
                  </React.Fragment>
                )}
              </Label>
            )}
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            {children ? children({ form, meta, field: fieldAttributes }) : <Input {...fieldAttributes} />}
            {hasError && showError && (
              <p className="text-xs text-red-600">{isOCError(error) ? formatFormErrorMessage(intl, error) : error}</p>
            )}
          </div>
        );
      }}
    </Field>
  );
}
