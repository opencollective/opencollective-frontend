import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import StyledButton from './StyledButton';
import Container from './Container';

const borderRadius = '4px';

const comboStyle = ({ combo }) => (combo ? '0' : `0 ${borderRadius} ${borderRadius} 0`);

const StyledButtonItem = styled(StyledButton)`
  border-radius: 0;
  line-height: 1.5;
  flex-grow: 1;
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

StyledButtonItem.defaultProps = {
  blacklist: StyledButton.defaultProps.blacklist.concat('combo'),
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
    {items.map(item => (
      <StyledButtonItem
        combo={combo || undefined}
        key={item}
        buttonSize={size}
        buttonStyle={item === selected ? 'primary' : 'standard'}
        onClick={onChange && (() => onChange(item))}
        className={item === selected ? 'selected' : undefined}
        disabled={disabled}
        type="button"
        {...buttonProps}
        {...(buttonPropsBuilder ? buttonPropsBuilder({ item }) : {})}
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
  size: PropTypes.oneOf(['small', 'medium', 'large']),
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
};

StyledButtonSet.defaultProps = {
  combo: false,
  size: 'medium',
  fontSize: 'Paragraph',
};

export default StyledButtonSet;
