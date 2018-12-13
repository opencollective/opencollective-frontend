import PropTypes from 'prop-types';
import Downshift from 'downshift';
import styled from 'styled-components';
import { SelectArrows } from 'styled-icons/boxicons-regular/SelectArrows.cjs';
import { themeGet } from 'styled-system';
import { Box } from '@rebass/grid';

import Container from './Container';

const matches = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const getBgColor = ({ highlightedIndex, index, item, selectedItem }) => {
  if (highlightedIndex === index) {
    return 'black.100';
  }

  if (matches(item, selectedItem)) {
    return 'primary.500';
  }

  return 'white.full';
};

const getBorderColor = ({ error, success }) => {
  if (error) {
    return 'red.500';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.300';
};

export const getItems = options =>
  Object.keys(options).reduce(
    (items, key) =>
      items.concat({
        key: Array.isArray(options)
          ? typeof options[key] === 'object'
            ? JSON.stringify(options[key])
            : options[key]
          : key,
        value: options[key],
      }),
    [],
  );

const SelectContainer = styled(Container)`
  &:hover,
  &:focus {
    border-color: ${themeGet('colors.primary.300')};

    svg {
      color: ${themeGet('colors.primary.300')};
    }
  }
`;

const ListItem = styled(Container)`
  list-style: none;
`;

const Icon = styled(SelectArrows)`
  color: ${themeGet('colors.black.400')};

  &:hover {
    color: ${themeGet('colors.primary.300')};
  }

  ${props => props.error && `color: ${themeGet('colors.red.500')(props)}`};
  ${props => props.success && `color: ${themeGet('colors.green.300')(props)}`};
  ${props => props.disabled && `color: ${themeGet('colors.black.300')(props)}`};
`;

const StyledSelect = ({ children, error, defaultValue, disabled, id, name, onChange, options, success }) => (
  <Downshift
    onChange={onChange}
    initialSelectedItem={defaultValue ? getItems([defaultValue])[0] : null}
    itemToString={item => (item ? JSON.stringify(item) : null)}
  >
    {({ getInputProps, getItemProps, getMenuProps, highlightedIndex, isOpen, selectedItem, toggleMenu }) => (
      <div>
        <SelectContainer
          tabIndex={disabled ? -1 : 0}
          display="flex"
          alignItems="center"
          bg={disabled ? 'black.50' : 'white.full'}
          border="1px solid"
          borderColor={getBorderColor({ error, success })}
          borderRadius="4px"
          fontSize="Paragraph"
          p={2}
          {...getInputProps({
            disabled,
            id,
            name,
            onClick: () => !disabled && toggleMenu(),
            onKeyDown: ({ key }) => key === 'Enter' && !disabled && toggleMenu(),
          })}
        >
          <Box flex="1 1 auto">{selectedItem && children(selectedItem)}</Box>
          <Icon size={14} disabled={disabled} error={error} success={success} />
        </SelectContainer>
        {isOpen && (
          <Container
            as="ul"
            px={1}
            pt={1}
            mt={2}
            border="1px solid"
            borderColor="black.300"
            borderRadius="4px"
            maxHeight={200}
            overflow="scroll"
            {...getMenuProps()}
          >
            {getItems(options).map((item, index) => (
              <ListItem
                {...getItemProps({
                  key: item.key,
                  index,
                  item,
                  as: 'li',
                  bg: getBgColor({ highlightedIndex, index, item, selectedItem }),
                  borderRadius: '4px',
                  color: matches(item, selectedItem) && highlightedIndex !== index ? 'white.full' : 'black.800',
                  mb: 1,
                  p: 2,
                })}
              >
                {children(item)}
              </ListItem>
            ))}
          </Container>
        )}
      </div>
    )}
  </Downshift>
);

StyledSelect.propTypes = {
  /** used to display the value of an item */
  children: PropTypes.func,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()]),
  /** disable selecion */
  disabled: PropTypes.func,
  /** show error state */
  error: PropTypes.bool,
  /** element id for forms */
  id: PropTypes.string,
  /** element name for forms */
  name: PropTypes.string,
  /** event handler for when a selection is made */
  onChange: PropTypes.func,
  /** list or map of options to display */
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
  ]).isRequired,
  /** show success state */
  success: PropTypes.bool,
};

StyledSelect.defaultProps = {
  children: ({ value }) => value,
};

export default StyledSelect;
