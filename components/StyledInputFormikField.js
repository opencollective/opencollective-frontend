import React from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { pickBy } from 'lodash';
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
const StyledInputFormikField = ({
  name,
  children,
  validate = undefined,
  isFastField = false,
  flex = undefined,
  width = undefined,
  display = undefined,
  flexGrow = undefined,
  ...props
}) => {
  const intl = useIntl();
  const FieldComponent = isFastField ? FastField : Field;
  const htmlFor = props.htmlFor || `input-${name}`;
  return (
    <FieldComponent name={name} validate={validate}>
      {({ field, form, meta }) => {
        const showError = Boolean(meta.error && (meta.touched || form.submitCount));
        return (
          <Container flex={flex} width={width} display={display} flexGrow={flexGrow}>
            <StyledInputField error={Boolean(meta.error)} {...props} name={name} htmlFor={htmlFor}>
              <React.Fragment>
                {children({
                  form,
                  meta,
                  field: pickBy(
                    {
                      ...field,
                      name: name || htmlFor,
                      id: htmlFor,
                      type: props.inputType,
                      disabled: props.disabled,
                      required: props.required,
                      error: showError,
                    },
                    value => value !== undefined,
                  ),
                })}
                {showError && (
                  <P display="block" color="red.500" pt={2} fontSize="10px">
                    {isOCError(meta.error) ? formatFormErrorMessage(intl, meta.error) : meta.error}
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
  flexGrow: PropTypes.any,
};

export default StyledInputFormikField;
