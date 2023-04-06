import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import Container from './Container';
import StyledButton from './StyledButton';

const ButtonItem = styled(StyledButton)`
  border-radius: 0;
  line-height: 1.5;
  flex-grow: 1;
  border-color: ${themeGet('colors.black.300')};
  transition: color 0.2s, background 0.1s, font-size 30ms;

  &:active p {
    color: white;
  }
  &:hover,
  &:focus {
    /* Use a higher z-index on hover to get all the borders colored */
    z-index: 9;
  }
  /* Remove the dotted outline on Firefox */
  &::-moz-focus-inner {
    border: 0;
  }
  &:first-child {
    border-radius: ${({ customBorderRadius }) => `${customBorderRadius} 0 0 ${customBorderRadius}`};
  }
  &:not(:first-child) {
    margin-left: -1px;
  }
  &:last-child {
    border-radius: ${({ combo, customBorderRadius }) =>
      combo ? '0' : `0 ${customBorderRadius} ${customBorderRadius} 0`};
  }
`;

ButtonItem.propTypes = {
  combo: PropTypes.bool,
};

const StyledButtonItem = ({
  index,
  size,
  item,
  children,
  selected,
  buttonProps,
  buttonPropsBuilder,
  onChange,
  combo,
  disabled,
  customBorderRadius,
}) => {
  const isPicked = item === selected;
  const [isAlwaysShown, setIsAlwaysShown] = useState(isPicked);

  useEffect(() => {
    if (isPicked && !isAlwaysShown) {
      setIsAlwaysShown(true);
    }
  }, [isPicked, isAlwaysShown]);

  return (
    <ButtonItem
      combo={combo || undefined}
      color={isPicked ? 'white' : 'black.400'}
      buttonSize={size}
      buttonStyle={isPicked ? 'primary' : undefined}
      onClick={onChange && (() => onChange(item))}
      className={isPicked ? 'selected' : undefined}
      disabled={disabled}
      aria-pressed={isPicked}
      type="button"
      py="8px"
      customBorderRadius={customBorderRadius}
      {...buttonProps}
      {...(buttonPropsBuilder ? buttonPropsBuilder({ item, index, isSelected: isPicked }) : {})}
      {...(isAlwaysShown ? { display: 'inline-block' } : {})}
    >
      {children({ item, isSelected: isPicked })}
    </ButtonItem>
  );
};

StyledButtonItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.any.isRequired,
  children: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'tiny']),
  selected: PropTypes.any,
  onChange: PropTypes.func,
  combo: PropTypes.bool,
  disabled: PropTypes.bool,
  buttonPropsBuilder: PropTypes.func,
  buttonProps: PropTypes.object,
  customBorderRadius: PropTypes.string,
};

const StyledButtonSet = ({
  size,
  items,
  children,
  selected,
  buttonProps,
  buttonPropsBuilder,
  onChange,
  combo,
  disabled,
  customBorderRadius,
  ...props
}) => (
  <Container display="flex" {...props}>
    {items.map((item, index) => (
      <StyledButtonItem
        key={item}
        index={index}
        item={item}
        size={size}
        selected={selected}
        buttonProps={buttonProps}
        buttonPropsBuilder={buttonPropsBuilder}
        onChange={onChange}
        combo={combo}
        disabled={disabled}
        customBorderRadius={customBorderRadius}
      >
        {children}
      </StyledButtonItem>
    ))}
  </Container>
);

StyledButtonSet.propTypes = {
  /** A list of elements to build buttons uppon */
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  /** Button child content renderer. Get passed an object like { item, isSelected } */
  children: PropTypes.func.isRequired,
  /** Based on the design system theme */
  size: PropTypes.oneOf(['small', 'medium', 'large', 'tiny']),
  /** Currently selected item */
  selected: PropTypes.any,
  /** An optional func called with the new item when option changes */
  onChange: PropTypes.func,
  /** Setting to style last item to look good in combination with a text input */
  combo: PropTypes.bool,
  /** Disable user input */
  disabled: PropTypes.bool,
  /** Similar to `buttonProps` but allow props to be added dynamically based on item */
  buttonPropsBuilder: PropTypes.func,
  /** Button Props */
  buttonProps: PropTypes.object,
  customBorderRadius: PropTypes.string,
};

StyledButtonSet.defaultProps = {
  combo: false,
  size: 'medium',
  fontSize: '14px',
  customBorderRadius: '4px',
};

export default StyledButtonSet;
