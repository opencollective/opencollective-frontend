import React from 'react';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { Question } from '@styled-icons/remix-line/Question';
import { FormattedMessage } from 'react-intl';

import PrivateInfoIcon from './icons/PrivateInfoIcon';
import { Box, Flex } from './Grid';
import StyledTooltip from './StyledTooltip';
import { P, Span } from './Text';

const PrivateIconWithSpace = () => (
  <React.Fragment>
    &nbsp;
    <PrivateInfoIcon />
  </React.Fragment>
);

const QuestionMarkIconWithSpace = ({ helpText, labelFontSize, labelColor }) => (
  <StyledTooltip content={helpText}>
    &nbsp;
    <Question size={labelFontSize} color={labelColor} />
  </StyledTooltip>
);

/**
 * Form field to display an input element with a label and errors. Uses [renderProps](https://reactjs.org/docs/render-props.html#using-props-other-than-render) to pass field props like 'name' and 'id' to child input.
 */
const StyledInputField = ({
  children,
  label = undefined,
  htmlFor = undefined,
  name = undefined,
  error = undefined,
  hint = undefined,
  hintPosition = 'below',
  success = undefined,
  disabled = undefined,
  required = undefined,
  inputType = undefined,
  labelFontSize = undefined,
  labelFontWeight = '700',
  labelColor = 'black.800',
  labelProps = undefined,
  hideOptionalLabel = undefined,
  useRequiredLabel = undefined,
  requiredIndicator = '*',
  isPrivate = undefined,
  helpText = undefined,
  flexDirection = undefined,
  justifyContent = undefined,
  alignItems = undefined,
  placeholder = undefined,
  ...props
}) => {
  const isCheckbox = inputType === 'checkbox';
  htmlFor = htmlFor || (name ? `input-${name}` : undefined);
  const displayOptionalLabel = hideOptionalLabel ? false : required === false;
  const displayRequiredLabel = useRequiredLabel ? required === true : false;
  labelFontWeight = labelProps?.fontWeight || labelFontWeight;
  labelFontSize = labelProps?.labelFontSize || labelFontSize;
  const labelContent = label && (
    <Span color={labelColor} fontSize={labelFontSize} fontWeight={labelFontWeight}>
      {label}
    </Span>
  );

  const containerFlexDirection = flexDirection ?? (isCheckbox ? 'row-reverse' : 'column');
  const containerJustifyContent = justifyContent ?? 'flex-end';
  return (
    <Box data-cy={`InputField-${name || htmlFor || 'unknown'}`} {...props}>
      <Flex alignItems={alignItems} flexDirection={containerFlexDirection} justifyContent={containerJustifyContent}>
        {label && (
          <P
            as="label"
            htmlFor={htmlFor}
            display="flex"
            alignItems="center"
            fontSize={labelFontSize}
            fontWeight={labelFontWeight}
            mb={isCheckbox ? 0 : 2}
            mr={2}
            ml={isCheckbox ? 2 : undefined}
            cursor={isCheckbox ? 'pointer' : undefined}
            {...labelProps}
          >
            {displayOptionalLabel && !isCheckbox ? (
              <Span color="black.700" fontWeight="normal">
                <FormattedMessage
                  id="OptionalFieldLabel"
                  defaultMessage="{field} (optional)"
                  values={{ field: labelContent }}
                />
                {isPrivate && <PrivateIconWithSpace />}
              </Span>
            ) : displayRequiredLabel ? (
              <Span color="black.700" fontWeight={requiredIndicator === 'label' ? 'normal' : undefined}>
                {requiredIndicator === 'label' ? (
                  <FormattedMessage
                    id="RequiredFieldLabel"
                    defaultMessage="{field} (required)"
                    values={{ field: labelContent }}
                  />
                ) : (
                  <React.Fragment>{labelContent} *</React.Fragment>
                )}{' '}
                {isPrivate && <PrivateIconWithSpace />}
              </Span>
            ) : (
              <React.Fragment>
                {labelContent}
                {isPrivate && <PrivateIconWithSpace />}
              </React.Fragment>
            )}
            {helpText && (
              <QuestionMarkIconWithSpace helpText={helpText} labelColor={labelColor} labelFontSize={labelFontSize} />
            )}
          </P>
        )}
        {hint && hintPosition === 'above' && <div className="mb-2 text-xs font-light text-gray-600">{hint}</div>}
        {typeof children === 'function'
          ? children({
              name: name || htmlFor,
              id: htmlFor,
              type: inputType,
              error: Boolean(error) || undefined,
              success,
              disabled,
              required,
              placeholder,
            })
          : children}
      </Flex>
      {error && typeof error === 'string' && (
        <Box pt={2} lineHeight="1em">
          <ExclamationCircle color="#E03F6A" size={16} />
          <Span ml={1} color="black.700" fontSize="0.9em" css={{ verticalAlign: 'middle' }}>
            {error}
          </Span>
        </Box>
      )}
      {hint && hintPosition === 'below' && <div className="mt-1 text-xs font-light text-gray-600">{hint}</div>}
    </Box>
  );
};

export default StyledInputField;
