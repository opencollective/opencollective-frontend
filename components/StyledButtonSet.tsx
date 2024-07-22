import React, { useEffect, useState } from 'react';
import { themeGet } from '@styled-system/theme-get';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import type { ButtonSize } from '../lib/theme/variants/button';

import type { ContainerProps } from './Container';
import Container from './Container';
import type { StyledButtonProps } from './StyledButton';
import StyledButton from './StyledButton';

type ButtonItemProps = {
  customBorderRadius: string;
};

const ButtonItem = styled(StyledButton)<ButtonItemProps>`
  border-radius: 0;
  line-height: 1.5;
  flex-grow: 1;
  border-color: ${themeGet('colors.black.300')};
  transition:
    color 0.2s,
    background 0.1s,
    font-size 30ms;

  &:active p {
    color: white;
  }
  a {
    color: ${themeGet('colors.primary.600')};
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
    border-radius: ${({ customBorderRadius }) => `0 ${customBorderRadius} ${customBorderRadius} 0`};
  }
`;

type StyledButtonItemProps<T> = {
  index: number;
  item: T;
  children: ReactNode;
  size: ButtonSize;
  selected?: T;
  onChange?: (item: T) => void;
  disabled?: boolean;
  buttonPropsBuilder?: ({
    item,
    index,
    isSelected,
  }: {
    item: T;
    index: number;
    isSelected: boolean;
  }) => StyledButtonProps;
  buttonProps?: StyledButtonProps;
  customBorderRadius: string;
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
  disabled,
  customBorderRadius,
}: StyledButtonItemProps<string | number>) => {
  const isSelected = item === selected;
  const [isAlwaysShown, setIsAlwaysShown] = useState(isSelected);

  useEffect(() => {
    if (isSelected && !isAlwaysShown) {
      setIsAlwaysShown(true);
    }
  }, [isSelected, isAlwaysShown]);

  return (
    <ButtonItem
      color={isSelected ? 'white' : 'black.400'}
      buttonSize={size}
      buttonStyle={isSelected ? 'primary' : undefined}
      onClick={onChange && (() => onChange(item))}
      className={isSelected ? 'selected' : undefined}
      disabled={disabled}
      aria-pressed={isSelected}
      type="button"
      py="8px"
      customBorderRadius={customBorderRadius}
      {...buttonProps}
      {...(buttonPropsBuilder ? buttonPropsBuilder({ item, index, isSelected }) : {})}
      {...(isAlwaysShown ? { display: 'inline-block' } : {})}
      as={undefined}
    >
      {children}
    </ButtonItem>
  );
};

type StyledButtonSetProps<T> = Omit<ContainerProps, 'onChange' | 'size' | 'selected' | 'children'> & {
  /** A list of elements to build buttons upon */
  items: Array<T>;
  /** Button child content renderer. Get passed an object like { item, isSelected } */
  children: ({ item, isSelected }: { item: T; isSelected: boolean }) => ReactNode;
  /** Based on the design system theme */
  size?: ButtonSize;
  /** Currently selected item */
  selected?: T;
  /** An optional func called with the new item when option changes */
  onChange?: (item: T) => void;
  /** Disable user input */
  disabled?: boolean;
  /** Similar to `buttonProps` but allow props to be added dynamically based on item */
  buttonPropsBuilder?: ({
    item,
    index,
    isSelected,
  }: {
    item: T;
    index: number;
    isSelected: boolean;
  }) => StyledButtonProps;
  /** Button Props */
  buttonProps?: StyledButtonProps;
  customBorderRadius?: string;
};

const StyledButtonSet = ({
  size = 'medium',
  items,
  children,
  selected,
  buttonProps,
  buttonPropsBuilder,
  onChange,
  disabled,
  customBorderRadius = '4px',
  ...props
}: StyledButtonSetProps<string | number>) => (
  <Container display="flex" {...props} as={undefined}>
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
        disabled={disabled}
        customBorderRadius={customBorderRadius}
      >
        {' '}
        {children({ item, isSelected: item === selected })}
      </StyledButtonItem>
    ))}
  </Container>
);

export default StyledButtonSet;
