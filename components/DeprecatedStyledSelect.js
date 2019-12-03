import React from 'react';
import PropTypes from 'prop-types';
import Downshift from 'downshift';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { CaretDown } from '@styled-icons/fa-solid/CaretDown';
import { Box } from '@rebass/grid';

import { getInputBorderColor } from '../lib/styled_components_utils';
import Container from './Container';
import { Span } from './Text';

/**
 * Returns a function that will return a unique key from iteratee. As we rely on
 * <input/> only a string key is valid.
 *
 * @param {array|object} options an options iterable, the same one given to `DeprecatedStyledSelect`
 * @param {string|function} keyGetter a key to get value from, or an extract func
 */
export const getKeyExtractor = (options, keyGetter) => {
  if (typeof keyGetter === 'function') {
    return item => keyGetter(item).toString();
  } else if (typeof keyGetter === 'string') {
    return item => item[keyGetter].toString();
  } else if (Array.isArray(options)) {
    return item => item.toString();
  } else {
    return (_item, key) => key.toString();
  }
};

/**
 * Convert a list of items to an object like {key, value} to be used in selects
 * and other lists.
 *
 * @param {object[] | string[]} options a list of items to transform to be used in list
 * @param {string | func} key a string to get the unique key from objects, or
 *  a function that get passed the object and returns a key. If not passed, the
 *  JSON representation of the item will be used. This can have very bad performances
 *  impact, so we should avoid using it.
 */
export const getItems = (options, keyGetter) => {
  const keyExtractor = getKeyExtractor(options, keyGetter);

  return Object.keys(options).reduce(
    (items, key) =>
      items.concat({
        key: keyExtractor(options[key], key),
        value: options[key],
      }),
    [],
  );
};

const SelectContainer = styled(Container)`
  cursor: pointer;
  outline: none;
  line-height: 1.5;
  &:hover,
  &:focus {
    border-color: ${themeGet('colors.primary.300')};

    svg {
      color: ${themeGet('colors.primary.300')};
    }
  }

  ${props => props.disabled && 'cursor: not-allowed;'};

  ${props =>
    props.mode === 'select'
      ? css`
          border-width: 1px;
          border-style: solid;
          padding: 8px 12px;
        `
      : css`
          border-bottom-width: 1px;
          border-bottom-style: dashed;
          padding: 0 4px;
          height: 1em;
          min-width: 8em;
        `}
`;

const SelectPopupContainer = styled(Container)`
  position: absolute;
  z-index: 10;
  background: white;
  box-shadow: 0px 4px 14px rgba(20, 20, 20, 0.16);
`;

const StyledListItem = styled.li`
  list-style: none;
  cursor: pointer;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  color: #313233;
  /* We need !important here cause "Body.js" CSS is overriding this :( */
  margin: 0.2em !important;

  ${props => {
    if (props.isHighlighted) {
      return css`
        background: #f2f3f5;
      `;
    } else if (props.isSelected) {
      return css`
        background: #3385ff;
        color: white;
      `;
    } else {
      return css`
        background: white;
      `;
    }
  }}
`;

const Icon = styled(CaretDown)`
  color: ${themeGet('colors.black.400')};

  &:hover {
    color: ${themeGet('colors.primary.300')};
  }

  ${props => props.error && `color: ${themeGet('colors.red.500')(props)}`};
  ${props => props.success && `color: ${themeGet('colors.green.300')(props)}`};
  ${props => props.disabled && `color: ${themeGet('colors.black.300')(props)}`};
`;

const DefaultItemsListRenderer = ({
  StyledListItem,
  items,
  selectedItem,
  highlightedIndex,
  getItemProps,
  children,
}) => {
  return items.map((item, index) => (
    <StyledListItem
      key={item.key}
      isSelected={selectedItem && selectedItem.key === item.key}
      isHighlighted={highlightedIndex === index}
      {...getItemProps({ index, item })}
    >
      {children(item)}
    </StyledListItem>
  ));
};

export default class DeprecatedStyledSelect extends React.Component {
  static propTypes = {
    /** used to display the value of an item */
    children: PropTypes.func,
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()]),
    /** Use this to control the component state */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()]),
    /** disable selecion */
    disabled: PropTypes.bool,
    /** show error state */
    error: PropTypes.bool,
    /** element id for forms */
    id: PropTypes.string,
    /** element name for forms */
    name: PropTypes.string,
    /** event handler for when a selection is made */
    onChange: PropTypes.func,
    /** A placeholder to show when nothing's selected */
    placeholder: PropTypes.node,
    /** list or map of options to display */
    options: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
      PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
    ]).isRequired,
    /** Function to get the key from individual options */
    keyGetter: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    /** show success state */
    success: PropTypes.bool,
    /** Switch between display modes */
    mode: PropTypes.oneOf(['select', 'underlined']),
    /** A custom list renderer. Usefull for windowing or progressive loading */
    ItemsListRenderer: PropTypes.func,
    /** Is this input required? */
    required: PropTypes.bool,
  };

  static defaultProps = {
    children: ({ value }) => value,
    ItemsListRenderer: DefaultItemsListRenderer,
    mode: 'select',
    placeholder: '',
  };

  constructor(props) {
    super(props);
    this.state = { items: getItems(props.options, props.keyGetter) };
  }

  componentDidUpdate(oldProps) {
    if (oldProps.options !== this.props.options) {
      this.setState({ items: getItems(this.props.options, this.props.keyGetter) });
    }
  }

  /** Return the value if component is controlled, otherwise undefined */
  getValue() {
    if (this.props.value === undefined) {
      return undefined;
    }

    return this.props.value ? getItems([this.props.value], this.props.keyGetter)[0] : null;
  }

  render() {
    const { ItemsListRenderer, error, defaultValue, disabled, id, name, onChange, success, mode } = this.props;
    const initialSelectedItem = defaultValue ? getItems([defaultValue], this.props.keyGetter)[0] : undefined;

    return (
      <Downshift
        onChange={onChange}
        initialSelectedItem={initialSelectedItem}
        selectedItem={this.getValue()}
        itemToString={item => item && item.key}
      >
        {({ getInputProps, getItemProps, getMenuProps, highlightedIndex, isOpen, selectedItem, toggleMenu }) => (
          <div>
            <SelectContainer
              tabIndex={disabled ? -1 : 0}
              display="flex"
              alignItems="center"
              bg={disabled ? 'black.50' : 'white.full'}
              borderColor={getInputBorderColor(error, success)}
              borderRadius="4px"
              fontSize="Paragraph"
              mode={mode}
              {...getInputProps({
                disabled,
                id,
                name,
                onClick: () => !disabled && toggleMenu(),
                onKeyDown: ({ key }) => key === 'Enter' && !disabled && toggleMenu(),
              })}
            >
              <Box flex="1 1 auto" mr={1}>
                {selectedItem ? (
                  this.props.children(selectedItem)
                ) : (
                  <Span color={this.props.required ? 'primary.700' : 'black.600'}>{this.props.placeholder}</Span>
                )}
              </Box>
              {mode === 'select' && <Icon size="1.2em" disabled={disabled} error={error} success={success} />}
            </SelectContainer>
            {isOpen && (
              <SelectPopupContainer
                as="ul"
                p={1}
                mt={1}
                border="1px solid"
                borderColor="black.300"
                borderRadius="4px"
                maxHeight={200}
                overflow="auto"
                fontSize="Paragraph"
                {...getMenuProps()}
              >
                <ItemsListRenderer
                  StyledListItem={StyledListItem}
                  items={this.state.items}
                  selectedItem={selectedItem}
                  highlightedIndex={highlightedIndex}
                  getItemProps={getItemProps}
                >
                  {this.props.children}
                </ItemsListRenderer>
              </SelectPopupContainer>
            )}
          </div>
        )}
      </Downshift>
    );
  }
}
