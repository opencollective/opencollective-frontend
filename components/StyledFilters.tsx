import React from 'react';
import styled, { css } from 'styled-components';
import type { FlexGrowProps, FlexWrapProps } from 'styled-system';

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

type StyledFiltersProps = {
  filters: string[];
  getLabel?: (filter: string) => string;
  disabled?: boolean;
  buttonGrow?: FlexGrowProps['flexGrow'];
  minButtonWidth?: number | string;
  buttonHeight?: number | string;
  buttonPadding?: number | string;
  flexWrap?: FlexWrapProps['flexWrap'];
} & (
  | {
      multiSelect?: false;
      onChange: (value: string) => void;
      selected: string;
    }
  | {
      multiSelect: true;
      onChange: (value: string[]) => void;
      selected: string[];
    }
);

/**
 * A controlled component to display a list of filters.
 */
export default function StyledFilters(props: StyledFiltersProps) {
  const {
    minButtonWidth,
    buttonPadding,
    buttonHeight,
    disabled,
    buttonGrow,
    onChange,
    selected,
    filters,
    multiSelect,
    ...flexProps
  } = props;

  const onFilterClick = React.useCallback(
    (clickedFilter: string) => {
      if (multiSelect === true) {
        const idx = selected.indexOf(clickedFilter);

        if (idx >= 0) {
          onChange([...selected.slice(0, idx), ...selected.slice(idx + 1)]);
        } else {
          onChange([...selected, clickedFilter]);
        }
      } else {
        if (selected !== clickedFilter) {
          onChange(clickedFilter);
        }
      }
    },
    [selected, multiSelect, onChange],
  );

  const isSelected = React.useCallback(
    (filter: string) => {
      if (multiSelect === true) {
        return selected.includes(filter);
      } else {
        return selected === filter;
      }
    },
    [selected],
  );

  const getLabel = props.getLabel ?? ((filter: string) => filter);

  return (
    <Flex data-cy="filters" px={1} py={1} css={{ overflowX: 'auto' }} gap="8px" {...flexProps}>
      {filters.map(filter => {
        return (
          <ButtonContainer key={filter} flexGrow={buttonGrow}>
            <FilterButton
              data-cy={`filter-button ${filter.toLowerCase()}`}
              onClick={() => onFilterClick(filter)}
              data-selected={isSelected(filter)}
              minWidth={minButtonWidth}
              disabled={disabled}
              height={buttonHeight || '34px'}
              padding={buttonPadding || '4px 14px'}
            >
              <Span whiteSpace="nowrap">{getLabel(filter)}</Span>
            </FilterButton>
          </ButtonContainer>
        );
      })}
    </Flex>
  );
}
