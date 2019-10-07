import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import StyledButton from './StyledButton';
import { Span } from './Text';

/**
 * A controlled component to display a list of filters.
 */
const StyledFilters = ({ filters, getLabel, onChange, selected, minButtonWidth, ...flexProps }) => {
  return (
    <Flex data-cy="filters" css={{ overflowX: 'auto' }} {...flexProps}>
      {filters.map((filter, idx) => {
        const isSelected = filter === selected;
        return (
          <StyledButton
            data-cy={`filter-button ${filter.toLowerCase()}`}
            key={filter}
            onClick={isSelected ? undefined : () => onChange(filter)}
            height={32}
            buttonStyle={isSelected ? 'primary' : 'standard'}
            minWidth={minButtonWidth}
            ml={idx === 0 ? 0 : 2}
            mr={2}
            py={1}
          >
            <Span whiteSpace="nowrap">{getLabel(filter)}</Span>
          </StyledButton>
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
  minButtonWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selectedButtonStyle: PropTypes.oneOf(['primary', 'secondary', 'dark']),
};

StyledFilters.defaultProps = {
  getLabel: filter => filter,
  selectedButtonStyle: 'primary',
};

export default StyledFilters;
