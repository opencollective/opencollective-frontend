import PropTypes from 'prop-types';
import Downshift from 'downshift';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { SelectArrows } from 'styled-icons/boxicons-regular/SelectArrows.cjs';

import Container from './Container';
import StyledInputGroup from './StyledInputGroup';

const ListItem = styled(Container)`
  list-style: none;
`;

const Icon = styled(SelectArrows)`
  &:hover {
    color: ${themeGet('colors.primary.300')};
  }

  ${props => props.error && `color: ${themeGet('colors.red.500')(props)}`};
  ${props => props.success && `color: ${themeGet('colors.green.300')(props)}`};
  ${props => props.disabled && `color: ${themeGet('colors.black.300')(props)}`};
`;

const matches = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const getItems = options =>
  Object.keys(options).reduce(
    (items, key) =>
      items.concat({ key: Array.isArray(options) ? JSON.stringify(options[key]) : key, value: options[key] }),
    [],
  );

const getBgColor = ({ highlightedIndex, index, item, selectedItem }) => {
  if (highlightedIndex === index) {
    return 'black.100';
  }

  if (matches(item, selectedItem)) {
    return 'primary.500';
  }

  return 'white.full';
};

const StyledDropdownInput = ({
  children,
  error,
  disabled,
  filter,
  id,
  itemToString,
  name,
  onChange,
  onInputChange,
  options,
  success,
}) => (
  <Downshift
    onChange={onChange}
    onInputValueChange={onInputChange}
    defaultHighlightedIndex={0}
    itemToString={itemToString}
  >
    {({
      clearSelection,
      getInputProps,
      getItemProps,
      getMenuProps,
      highlightedIndex,
      inputValue,
      isOpen,
      openMenu,
      selectedItem,
      toggleMenu,
    }) => (
      <div>
        <StyledInputGroup
          append={<Icon size={14} onClick={toggleMenu} />}
          type="text"
          id={id}
          name={name}
          {...getInputProps({
            error,
            disabled,
            success,
            fontSize: 'Paragraph',
            onChange: clearSelection,
            onFocus: openMenu,
            onClick: () => !isOpen && toggleMenu(),
          })}
        />
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
            {getItems(options)
              .filter(item => filter(inputValue, item))
              .map((item, index) => (
                // eslint-disable-next-line react/jsx-key
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

StyledDropdownInput.propTypes = {
  /** used to display the value of an item */
  children: PropTypes.func,
  /** disable selecion */
  disabled: PropTypes.func,
  /** show error state */
  error: PropTypes.bool,
  /** used to filter items based on the current input value */
  filter: PropTypes.func,
  /** element id for forms */
  id: PropTypes.string,
  /** used to format the selected item for display */
  itemToString: PropTypes.func,
  /** element name for forms */
  name: PropTypes.string,
  /** event handler for when a selection is made */
  onChange: PropTypes.func,
  /** event handler for when the input value changes */
  onInputChange: PropTypes.func,
  /** list or map of options to display */
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
  ]).isRequired,
  /** show success state */
  success: PropTypes.bool,
};

StyledDropdownInput.defaultProps = {
  children: ({ value }) => value,
  filter: () => true,
  itemToString: item => (item ? item.value : null),
  onInputChange: () => {}, // noop
};

export default StyledDropdownInput;
