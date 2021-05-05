import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from './Grid';
import { P, Span } from './Text';

/**
 * Form field to display an input element with a label and errors. Uses [renderProps](https://reactjs.org/docs/render-props.html#using-props-other-than-render) to pass field props like 'name' and 'id' to child input.
 */
const StyledInputField = ({
  children,
  label,
  htmlFor,
  name,
  error,
  success,
  disabled,
  required,
  inputType,
  labelFontSize,
  labelFontWeight,
  labelColor,
  labelProps,
  hideOptionalLabel,
  ...props
}) => {
  const labelContent = label && <Span color={labelColor}>{label}</Span>;
  const isCheckbox = inputType === 'checkbox';
  htmlFor = htmlFor || (name ? `input-${name}` : undefined);

  const displayOptionalLabel = hideOptionalLabel ? false : required === false;
  const displayRequiredLabel = hideOptionalLabel ? required === true : false;

  return (
    <Box {...props}>
      <Flex flexDirection={isCheckbox ? 'row-reverse' : 'column'} justifyContent="flex-end">
        {label && (
          <P
            as="label"
            htmlFor={htmlFor}
            display="block"
            fontSize={labelFontSize}
            fontWeight={labelFontWeight}
            mb={isCheckbox ? 0 : 2}
            mr={2}
            ml={isCheckbox ? 2 : undefined}
            cursor={isCheckbox ? 'pointer' : undefined}
            {...labelProps}
          >
            {displayOptionalLabel && !isCheckbox ? (
              <Span color="black.500">
                <FormattedMessage
                  id="OptionalFieldLabel"
                  defaultMessage="{field} (optional)"
                  values={{ field: labelContent }}
                />
              </Span>
            ) : displayRequiredLabel ? (
              <Span color="black.500">{labelContent} *</Span>
            ) : (
              labelContent
            )}
          </P>
        )}
        {typeof children === 'function'
          ? children({
              name: name || htmlFor,
              id: htmlFor,
              type: inputType,
              error: Boolean(error) || undefined,
              success,
              disabled,
              required,
            })
          : children}
      </Flex>
      {error && typeof error === 'string' && (
        <Span display="block" color="red.500" pt={2} fontSize="10px">
          {error}
        </Span>
      )}
    </Box>
  );
};

StyledInputField.propTypes = {
  /** React component to wrap with the label and errors */
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** text to display below the input or error status */
  error: PropTypes.any,
  /** the label's 'for' attribute to be used as the 'name' and 'id' for the input */
  htmlFor: PropTypes.string,
  /** By default name is equal to htmlFor, but you can use this prop to override it */
  name: PropTypes.string,
  /** text to display above the input */
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  /** Passed to input as `type`. Adapts layout for checkboxes */
  inputType: PropTypes.string,
  /** Show success state for field */
  success: PropTypes.bool,
  /** If set to false, the field will be marked as optional */
  required: PropTypes.bool,
  /** If set to true, will hide the (optional) label tag even if required is false and display * if required */
  useRequiredLabel: PropTypes.bool,
  /** Font size for the label */
  labelFontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /** Font weight for the label */
  labelFontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  labelColor: PropTypes.string,
  /** Anything here will be passed down to label */
  labelProps: PropTypes.object,
  /** All props from `Box` */
  ...Box.propTypes,
};

StyledInputField.defaultProps = {
  labelColor: 'black.800',
  labelFontWeight: 'normal',
};

export default StyledInputField;
