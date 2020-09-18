import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';

import Container from './Container';
import StyledButton from './StyledButton';

const borderRadius = '4px';

const comboStyle = ({ combo }) => (combo ? '0' : `0 ${borderRadius} ${borderRadius} 0`);

const StyledButtonItem = styled(StyledButton)`
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
    border-radius: ${borderRadius} 0 0 ${borderRadius};
  }
  &:not(:first-child) {
    margin-left: -1px;
  }
  &:last-child {
    border-radius: ${comboStyle};
  }
`;

StyledButtonItem.propTypes = {
  combo: PropTypes.bool,
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
  ...props
}) => (
  <Container display="flex" {...props}>
    {items.map((item, index) => (
      <StyledButtonItem
        combo={combo || undefined}
        color={item === selected ? 'white' : 'black.400'}
        key={item}
        buttonSize={size}
        buttonStyle={item === selected ? 'primary' : undefined}
        onClick={onChange && (() => onChange(item))}
        className={item === selected ? 'selected' : undefined}
        disabled={disabled}
        type="button"
        py="8px"
        {...buttonProps}
        {...(buttonPropsBuilder ? buttonPropsBuilder({ item, index, isSelected: item === selected }) : {})}
      >
        {children({ item, isSelected: item === selected })}
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
};

StyledButtonSet.defaultProps = {
  combo: false,
  size: 'medium',
  fontSize: '14px',
};

export default StyledButtonSet;
