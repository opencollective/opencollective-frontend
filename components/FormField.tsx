import React, { useContext } from 'react';
import type { FormikProps } from 'formik';
import { FastField, Field } from 'formik';
import { pickBy } from 'lodash';
import type { InputHTMLAttributes } from 'react';
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
  privateMessage,
  validate,
  className,
  labelClassName,
  hintClassName,
  errorClassName,
  isFastField = false,
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
  privateMessage?: React.ReactNode;
  validate?: any;
  className?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
  autoFocus?: boolean;
  ref?: React.ForwardedRef<HTMLInputElement>;
  onFocus?: () => void;
  onChange?: (e) => void;
  isFastField?: boolean;
}) {
  const intl = useIntl();
  const htmlFor = props.htmlFor || `input-${name}`;
  const { schema } = useContext(FormikZodContext);
  const FieldComponent = isFastField ? FastField : Field;

  return (
    <FieldComponent name={name} validate={validate}>
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
              autoFocus: props.autoFocus,
              autoComplete: props.autoComplete,
              ref: props.ref,
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
              <Label className={cn('leading-normal', labelClassName)} htmlFor={htmlFor}>
                {label}{' '}
                {'required' in fieldAttributes && !fieldAttributes.required && (
                  <span className="font-normal text-muted-foreground">
                    (<FormattedMessage defaultMessage="optional" id="FormField.optional" />)
                  </span>
                )}
                {isPrivate && (
                  <React.Fragment>
                    &nbsp;
                    <PrivateInfoIcon children={privateMessage} />
                  </React.Fragment>
                )}
              </Label>
            )}
            {children ? children({ form, meta, field: fieldAttributes }) : <Input {...fieldAttributes} />}
            {hint && <p className={cn('text-sm text-muted-foreground', hintClassName)}>{hint}</p>}
            {hasError && showError && (
              <p className={cn('text-sm text-red-600', errorClassName)}>
                {isOCError(error)
                  ? formatFormErrorMessage(intl, error)
                  : typeof error === 'string'
                    ? error
                    : JSON.stringify(error) || 'Error'}
              </p>
            )}
          </div>
        );
      }}
    </FieldComponent>
  );
}
