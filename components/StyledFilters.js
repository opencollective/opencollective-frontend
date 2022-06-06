import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import { Span } from './Text';

const FilterButton = styled(StyledButton).attrs({
  buttonSize: 'tiny',
  buttonStyle: 'standard',
})`
  font-size: 14px;
  font-weight: 400;
  height: 34px;
  margin-right: 8px;
  padding-top: 4px;
  padding-bottom: 4px;
  background: #f9fafb;
  border-color: white;
  color: ${props => props.theme.colors.black[800]};

  ${props =>
    props.$isSelected &&
    css`
      &,
      &:hover,
      &:focus {
        background-color: ${props => props.theme.colors.primary[100]};
        border: 1px solid ${props => props.theme.colors.primary[700]};
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

/**
 * A controlled component to display a list of filters.
 */
const StyledFilters = ({ filters, disabled, getLabel, onChange, selected, minButtonWidth, ...flexProps }) => {
  return (
    <Flex data-cy="filters" px={1} py={1} css={{ overflowX: 'auto' }} {...flexProps}>
      {filters.map((filter, idx) => {
        const isSelected = filter === selected;
        return (
          <Span key={filter}>
            <FilterButton
              data-cy={`filter-button ${filter.toLowerCase()}`}
              onClick={isSelected ? undefined : () => onChange(filter)}
              $isSelected={isSelected}
              minWidth={minButtonWidth}
              ml={idx === 0 ? 0 : 2}
              disabled={disabled}
            >
              <Span whiteSpace="nowrap">{getLabel(filter)}</Span>
            </FilterButton>
          </Span>
        );
      })}
      <Box px={2} />
    </Flex>
  );
};

StyledFilters.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.string).isRequired,
  getLabel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  disabled: PropTypes.bool,
  minButtonWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selectedButtonStyle: PropTypes.oneOf(['primary', 'secondary', 'dark']),
};

StyledFilters.defaultProps = {
  getLabel: filter => filter,
  selectedButtonStyle: 'primary',
};

export default StyledFilters;
