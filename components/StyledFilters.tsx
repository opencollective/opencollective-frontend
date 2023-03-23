import React from 'react';
import styled, { css } from 'styled-components';
import { FlexGrowProps } from 'styled-system';

import { Flex } from './Grid';
import StyledButton from './StyledButton';
import { Span } from './Text';

const FilterButton = styled(StyledButton).attrs({
  buttonSize: 'tiny',
  buttonStyle: 'standard',
})`
  font-size: 14px;
  font-weight: 400;
  height: ${props => props.height};
  padding: ${(props: { padding: string | number }) => props.padding};
  background: #f9fafb;
  border-color: white;
  color: ${props => props.theme.colors.black[800]};

  ${props =>
    props['data-selected'] &&
    css`
      &,
      &:hover,
      &:focus {
        background-color: ${props => props.theme.colors.primary[100]};
        border: 1px solid ${props => props.theme.colors.primary[700]};
        color: ${props => props.theme.colors.primary[900]};
        box-shadow: none;
      }
    `}

  &:active {
    background-color: ${props => props.theme.colors.primary[100]};
    color: ${props => props.theme.colors.primary[800]};
  }
  &:focus {
    border: 2px solid #050505;
  }
`;

const ButtonContainer = styled.span<{ flexGrow: FlexGrowProps['flexGrow'] }>`
  ${props =>
    props.flexGrow &&
    css`
      flex-grow: ${props.flexGrow};
    `}
`;

const defaultGetLabel = filter => filter;

type StyledFiltersProps = {
  filters: string[];
  getLabel: (string) => string;
  onChange: (value) => void;
  selected: string;
  disabled?: boolean;
  buttonGrow?: FlexGrowProps['flexGrow'];
  minButtonWidth?: number | string;
  buttonHeight?: number | string;
  buttonPadding?: number | string;
};

/**
 * A controlled component to display a list of filters.
 */
const StyledFilters = ({
  filters,
  onChange,
  disabled = false,
  getLabel = defaultGetLabel,
  selected = undefined,
  minButtonWidth = undefined,
  buttonHeight = '34px',
  buttonPadding = '4px 14px',
  buttonGrow = undefined,
  ...flexProps
}: StyledFiltersProps) => {
  return (
    <Flex data-cy="filters" px={1} py={1} css={{ overflowX: 'auto' }} gap="8px" {...flexProps}>
      {filters.map(filter => {
        const isSelected = filter === selected;
        return (
          <ButtonContainer key={filter} flexGrow={buttonGrow}>
            <FilterButton
              data-cy={`filter-button ${filter.toLowerCase()}`}
              onClick={isSelected ? undefined : () => onChange(filter)}
              data-selected={isSelected}
              minWidth={minButtonWidth}
              disabled={disabled}
              height={buttonHeight}
              padding={buttonPadding}
            >
              <Span whiteSpace="nowrap">{getLabel(filter)}</Span>
            </FilterButton>
          </ButtonContainer>
        );
      })}
    </Flex>
  );
};

export default StyledFilters;
