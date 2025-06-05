import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FastField, Field, useFormikContext } from 'formik';
import { has, pickBy } from 'lodash';
import { useIntl } from 'react-intl';

import { isOCError } from '../lib/errors';
import { formatFormErrorMessage, RICH_ERROR_MESSAGES } from '../lib/form-utils';
import { cn } from '../lib/utils';

import Container from './Container';
import { FormikZodContext, getInputAttributesFromZodSchema } from './FormikZod';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import { P } from './Text';

export const ERROR_CLASS_NAME = 'formik-field-with-error';

/**
 * A special wrapper around `StyledInputField` + Formik's `Field` component.
 * Accept all props from `StyledInputField`.
 */
const StyledInputFormikField = ({
  name,
  children = null,
  validate = undefined,
  isFastField = false,
  flex = undefined,
  width = undefined,
  display = undefined,
  flexGrow = undefined,
  placeholder = undefined,
  showError = true,
  formatValue = null,
  ...props
}) => {
  const intl = useIntl();
  const FieldComponent = isFastField ? FastField : Field;
  const htmlFor = props.htmlFor || `input-${name}`;
  const { schema, config } = useContext(FormikZodContext);
  const formik = useFormikContext();
  return (
    <FieldComponent name={name} validate={validate}>
      {({ field, form, meta }) => {
        const hasError = Boolean(meta.error && (meta.touched || form.submitCount));
        const fieldAttributes = {
          ...(formik.isSubmitting ? { disabled: true } : {}),
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
              autoFocus: props.autoFocus,
              error: hasError,
              placeholder,
            },
            value => value !== undefined,
          ),
        };

        if (
          !fieldAttributes.required &&
          meta.error &&
          meta.error === intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue)
        ) {
          fieldAttributes.required = true;
        }

        if (has(fieldAttributes, 'value') && formatValue) {
          fieldAttributes.value = formatValue(fieldAttributes.value);
        }

        return (
          <Container
            flex={flex}
            width={width}
            display={display}
            flexGrow={flexGrow}
            className={cn({ [ERROR_CLASS_NAME]: hasError })}
          >
            <StyledInputField
              error={Boolean(meta.error)}
              {...(config || null)}
              {...props}
              htmlFor={htmlFor}
              name={fieldAttributes.name}
              required={fieldAttributes.required}
            >
              <React.Fragment>
                {children ? children({ form, meta, field: fieldAttributes }) : <StyledInput {...fieldAttributes} />}
                {hasError && showError && (
                  <P display="block" color="red.500" pt={2} fontSize="11px">
                    {isOCError(meta.error)
                      ? formatFormErrorMessage(intl, meta.error)
                      : typeof meta.error === 'string'
                        ? meta.error
                        : JSON.stringify(meta.error)}
                  </P>
                )}
              </React.Fragment>
            </StyledInputField>
          </Container>
        );
      }}
    </FieldComponent>
  );
};

StyledInputFormikField.propTypes = {
  name: PropTypes.string.isRequired,
  validate: PropTypes.func,
  isFastField: PropTypes.bool,
  children: PropTypes.func,
  /** the label's 'for' attribute to be used as the 'name' and 'id' for the input */
  htmlFor: PropTypes.string,
  id: PropTypes.string,
  /** Passed to input as `type`. Adapts layout for checkboxes */
  inputType: PropTypes.string,
  placeholder: PropTypes.string,
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** If set to false, the field will be marked as optional */
  required: PropTypes.bool,
  flex: PropTypes.any,
  display: PropTypes.any,
  width: PropTypes.any,
  flexGrow: PropTypes.any,
  showError: PropTypes.bool,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formatValue: PropTypes.func,
  autoFocus: PropTypes.bool,
};

export default StyledInputFormikField;
