import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { get } from 'lodash';
import styled from 'styled-components';

import Container from './Container';
import StyledInput from './StyledInput';
import { Span } from './Text';

const InputContainer = styled(Container)`
  &:hover {
    border-color: ${themeGet('colors.primary.300')};
  }

  &:focus-within {
    border-color: ${themeGet('colors.primary.500')};
  }

  input {
    border: none;
    outline: none;
    box-shadow: none;
  }

  input:focus ~ div svg {
    color: ${themeGet('colors.primary.300')};
  }
`;

const getColor = ({ error, success }) => {
  if (error) {
    return 'red.300';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.800';
};

const getBgColor = ({ error, focused, success, defaultBg = 'black.50' }) => {
  if (focused) {
    return 'primary.100';
  }

  if (error) {
    return 'red.100';
  }

  if (success) {
    return 'green.100';
  }

  return defaultBg;
};

const getBorderColor = ({ error, focused, success }) => {
  if (focused) {
    return 'primary.300';
  }

  if (error) {
    return 'red.500';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.300';
};

/**
 * A styled input with a prepended or appended field element.
 * @see See [StyledInput](/#!/StyledInput) for details about props passed to it
 */
const StyledInputGroup = ({
  append = undefined,
  prepend = undefined,
  disabled = undefined,
  success = undefined,
  error = undefined,
  maxWidth = undefined,
  containerProps = undefined,
  prependProps = undefined,
  appendProps = undefined,
  innerRef = undefined,
  autoFocus = undefined,
  overflow = undefined,
  ...inputProps
}) => {
  const [focused, setFocus] = useState(false);
  return (
    <React.Fragment>
      <InputContainer
        bg={disabled ? 'black.50' : 'white.full'}
        maxWidth={maxWidth}
        border="1px solid"
        borderColor={getBorderColor({ error, focused, success })}
        borderRadius="4px"
        display="flex"
        alignItems="center"
        lineHeight="1.5"
        {...containerProps}
      >
        {prepend && (
          <Container
            fontSize="14px"
            borderRadius="4px 0 0 4px"
            p={2}
            color={getColor({ error, success })}
            maxHeight="100%"
            whiteSpace="nowrap"
            {...prependProps}
            bg={(disabled && 'black.50') || get(prependProps, 'bg') || getBgColor({ error, focused, success })}
          >
            {prepend}
          </Container>
        )}
        <StyledInput
          bare
          autoFocus={autoFocus}
          color={getColor({ error, success })}
          type="text"
          overflow={overflow || 'scroll'}
          fontSize="14px"
          flex="1 1 auto"
          disabled={disabled}
          py="0"
          px={2}
          maxHeight="100%"
          error={error}
          minWidth="0"
          width="100%"
          ref={innerRef}
          {...inputProps}
          onFocus={e => {
            setFocus(true);
            if (inputProps.onFocus) {
              inputProps.onFocus(e);
            }
          }}
          onBlur={e => {
            setFocus(false);
            if (inputProps.onBlur) {
              inputProps.onBlur(e);
            }
          }}
        />
        {append && (
          <Container
            borderRadius="4px 0 0 4px"
            p={2}
            color={getColor({ error, success })}
            fontSize="14px"
            {...appendProps}
            bg={getBgColor({ error, focused, success, defaultBg: appendProps?.bg })}
          >
            {append}
          </Container>
        )}
      </InputContainer>
      {Boolean(error) && typeof error !== 'boolean' && (
        <Span display="block" color="red.500" pt={2} fontSize="10px">
          {error}
        </Span>
      )}
    </React.Fragment>
  );
};

StyledInputGroup.propTypes = {
  /** Text shown after input */
  append: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.element]),
  /** Text shown before input */
  prepend: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.element]),
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** Show error state for field, and a message error if given a string */
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  /** Show success state for field */
  success: PropTypes.bool,
  /** Passed to internal StyledInput */
  type: PropTypes.string,
  /** Props passed to the `InputContainer` */
  containerProps: PropTypes.object,
  /** Props passed to the prepend `Container` */
  prependProps: PropTypes.object,
  /** Props passed to the append `Container` */
  appendProps: PropTypes.object,
  /** Max Width */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Whether to auto focus this element **/
  autoFocus: PropTypes.bool,
  /** Specifies what should happen if content overflows an element's box **/
  overflow: PropTypes.string,
  innerRef: PropTypes.any,
};

export default StyledInputGroup;
