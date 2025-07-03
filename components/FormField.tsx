import React, { useContext } from 'react';
import type { FormikProps } from 'formik';
import { Field } from 'formik';
import { pickBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { isOCError } from '../lib/errors';
import { formatFormErrorMessage, RICH_ERROR_MESSAGES } from '../lib/form-utils';
import { cn } from '@/lib/utils';

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
  validate,
  className,
  ...props
}: {
  label?: string | React.ReactNode;
  showError?: boolean;
  name: string;
  hint?: string | React.ReactNode;
  placeholder?: string;
  children?: (props: { form: FormikProps<any>; meta: any; field: any; hasError?: boolean }) => React.ReactNode;
  required?: boolean;
  min?: number;
  max?: number;
  inputType?: string;
  type?: string;
  disabled?: boolean;
  htmlFor?: string;
  error?: string;
  isPrivate?: boolean;
  validate?: any;
  className?: string;
  onFocus?: () => void;
  onChange?: (e) => void;
}) {
  const intl = useIntl();
  const htmlFor = props.htmlFor || `input-${name}`;
  const { schema } = useContext(FormikZodContext);

  return (
    <Field name={name} validate={validate}>
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
              type: props.inputType || props.type,
              disabled: props.disabled,
              min: props.min,
              max: props.max,
              required: props.required,
              error: hasError,
              placeholder,
              onFocus: props.onFocus,
              onChange: props.onChange || field.onChange,
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
          <div className={cn('flex w-full flex-col gap-1', className)}>
            {label && (
              <Label className="leading-normal" htmlFor={htmlFor}>
                {label}{' '}
                {'required' in fieldAttributes && !fieldAttributes.required && (
                  <span className="font-normal text-muted-foreground">
                    (<FormattedMessage defaultMessage="optional" id="FormField.optional" />)
                  </span>
                )}
                {isPrivate && (
                  <React.Fragment>
                    &nbsp;
                    <PrivateInfoIcon />
                  </React.Fragment>
                )}
              </Label>
            )}
            {children ? children({ form, meta, field: fieldAttributes }) : <Input {...fieldAttributes} />}
            {hasError && showError && (
              <p className="text-xs text-red-600">{isOCError(error) ? formatFormErrorMessage(intl, error) : error}</p>
            )}
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          </div>
        );
      }}
    </Field>
  );
}
