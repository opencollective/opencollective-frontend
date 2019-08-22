import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import StyledButton from './StyledButton';
import { Span } from './Text';

/**
 * A controlled component to display a list of filters.
 */
const StyledFilters = ({ filters, getLabel, onChange, selected, minButtonWidth }) => {
  return (
    <Flex css={{ overflowX: 'auto' }}>
      {filters.map(filter => {
        const isSelected = filter === selected;
        return (
          <StyledButton
            key={filter}
            onClick={isSelected ? undefined : () => onChange(filter)}
            buttonStyle={isSelected ? 'primary' : 'standard'}
            minWidth={minButtonWidth}
            mx={2}
          >
            <Span whiteSpace="nowrap">{getLabel(filter)}</Span>
          </StyledButton>
        );
      })}
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
