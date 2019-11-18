import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';

import Container from './Container';
import { Span } from './Text';
import StyledInput from './StyledInput';

const InputContainer = styled(Container)`
  &:hover {
    border-color: ${themeGet('colors.primary.300')};
    color: ${themeGet('colors.primary.300')};
  }

  &:focus-within {
    border-color: ${themeGet('colors.primary.300')};
    background-color: ${themeGet('colors.primary.500')};
    color: white;
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

const getColor = ({ error, focused, success }) => {
  if (focused) {
    return 'primary.300';
  }

  if (error) {
    return 'red.300';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.400';
};

const getBgColor = ({ error, focused, success }) => {
  if (focused) {
    return 'primary.500';
  }

  if (error) {
    return 'red.100';
  }

  if (success) {
    return 'green.100';
  }

  return 'black.50';
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
  append,
  prepend,
  disabled,
  success,
  error,
  maxWidth,
  containerProps,
  prependProps,
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
            fontSize="Paragraph"
            borderRadius="4px 0 0 4px"
            py={2}
            pl={2}
            pr={2}
            color={getColor({ error, focused, success })}
            {...prependProps}
            bg={(disabled && 'black.50') || get(prependProps, 'bg') || getBgColor({ error, focused, success })}
          >
            {prepend}
          </Container>
        )}
        <StyledInput
          bare
          color="black.800"
          type="text"
          overflow="scroll"
          fontSize="Paragraph"
          flex="1 1 auto"
          disabled={disabled}
          py="0"
          error={error}
          {...inputProps}
          onFocus={e => {
            setFocus(true);
            if (inputProps && inputProps.onFocus) {
              inputProps.onFocus(e);
            }
          }}
          onBlur={e => {
            setFocus(false);
            if (inputProps && inputProps.onBlur) {
              inputProps.onBlur(e);
            }
          }}
        />
        {append && (
          <Container bg={getBgColor({ error, focused, success })} borderRadius="4px 0 0 4px" p={2}>
            <Span color={getColor({ error, focused, success })} fontSize="Paragraph">
              {append}
            </Span>
          </Container>
        )}
      </InputContainer>
      {error && (
        <Span display="block" color="red.500" pt={2} fontSize="Tiny">
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
  /** Max Width */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default StyledInputGroup;
