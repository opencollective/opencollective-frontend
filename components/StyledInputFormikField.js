import React from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { useIntl } from 'react-intl';

import { isOCError } from '../lib/errors';
import { formatFormErrorMessage } from '../lib/form-utils';

import Container from './Container';
import StyledInputField from './StyledInputField';
import { P } from './Text';

/**
 * A special wrapper around `StyledInputField` + Formik's `Field` component.
 * Accept all props from `StyledInputField`.
 */
const StyledInputFormikField = ({ name, validate, children, isFastField, flex, width, display, ...props }) => {
  const intl = useIntl();
  const FieldComponent = isFastField ? FastField : Field;
  return (
    <FieldComponent name={name} validate={validate}>
      {({ field, form, meta }) => (
        <Container flex={flex} width={width} display={display}>
          <StyledInputField error={Boolean(meta.error)} {...props}>
            <React.Fragment>
              {children({
                form,
                meta,
                field: {
                  ...field,
                  name: name || props.htmlFor,
                  id: props.htmlFor,
                  type: props.inputType,
                  disabled: props.disabled,
                  required: props.required,
                  error: Boolean(meta.touched && meta.error),
                },
              })}
              {meta.touched && meta.error && (
                <P display="block" color="red.500" pt={2} fontSize="10px">
                  {isOCError(meta.error) ? formatFormErrorMessage(intl, meta.error) : meta.error}
                </P>
              )}
            </React.Fragment>
          </StyledInputField>
        </Container>
      )}
    </FieldComponent>
  );
};

StyledInputFormikField.propTypes = {
  name: PropTypes.string.isRequired,
  validate: PropTypes.bool,
  isFastField: PropTypes.func,
  children: PropTypes.func,
  /** the label's 'for' attribute to be used as the 'name' and 'id' for the input */
  htmlFor: PropTypes.string,
  id: PropTypes.string,
  /** Passed to input as `type`. Adapts layout for checkboxes */
  inputType: PropTypes.string,
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** If set to false, the field will be marked as optional */
  required: PropTypes.bool,
  flex: PropTypes.any,
  display: PropTypes.any,
  width: PropTypes.any,
};

export default StyledInputFormikField;
