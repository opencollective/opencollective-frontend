import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';

import { Box } from '@rebass/grid';
import { getItems, getKeyExtractor } from './DeprecatedStyledSelect';
import Container from './Container';

/**
 * Component for controlling a list of radio inputs
 */
const StyledRadioList = ({
  children,
  id,
  name,
  onChange,
  options,
  keyGetter,
  disabled,
  containerProps,
  labelProps,
  ...props
}) => {
  const [selected, setSelected] = useState(props.defaultValue);
  const keyExtractor = getKeyExtractor(options, keyGetter);
  const items = getItems(options, keyExtractor);
  const defaultValueStr = props.defaultValue !== undefined && props.defaultValue.toString();
  return (
    <Container
      id={id}
      as="fieldset"
      border="none"
      m={0}
      p={0}
      {...containerProps}
      onChange={event => {
        event.stopPropagation();
        const target = event.target;
        const selectedItem = find(items, item => item.key === target.value);
        onChange({ type: 'fieldset', name, key: selectedItem.key, value: selectedItem.value });
        setSelected(target.value);
      }}
    >
      {items.map(({ value, key }, index) => (
        <Container as="label" cursor="pointer" htmlFor={id && key + id} key={key} width={1} m={0} {...labelProps}>
          {children({
            checked: selected && key === selected,
            index,
            key,
            value,
            radio: (
              <input
                type="radio"
                name={name}
                id={id && key + id}
                value={key}
                defaultChecked={props.defaultValue !== undefined && defaultValueStr === key}
                disabled={disabled || (value && value.disabled)} // disable a specific option or entire options
              />
            ),
          })}
        </Container>
      ))}
    </Container>
  );
};

StyledRadioList.propTypes = {
  /**
   * render function used to display an option
   * @param {Object} props - Properties use for rendering each radio input
   * @param {*} props.key - unqiue key for the option derived from `options`
   * @param {*} props.value - value for the option derived from `options`
   * @param {boolean} props.checked - true if the radio item is selected
   * @param {number} props.index - order index of the option
   * @param {Component} props.radio - radio input component
   */
  children: PropTypes.func,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()]),
  /** element id for forms */
  id: PropTypes.string.isRequired,
  /** element name for radio inputs */
  name: PropTypes.string.isRequired,
  /** event handler for when a selection is made */
  onChange: PropTypes.func,
  /** list or map of options to display */
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
  ]).isRequired,
  /** A key name of a getter function to extract the unique key from option */
  keyGetter: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  /** To pass to the fieldset container */
  containerProps: PropTypes.object,
  /** To pass to the label container */
  labelProps: PropTypes.object,
  /** If true, user won't be able to interact with the element */
  disabled: PropTypes.bool,
};

const defaultChild = ({ value, radio }) => (
  <Box mb={2}>
    <Box as="span" mr={2}>
      {radio}
    </Box>
    {value}
  </Box>
);

defaultChild.propTypes = {
  value: PropTypes.string,
  radio: PropTypes.func,
};

StyledRadioList.defaultProps = {
  children: defaultChild,
  onChange: () => {}, // noop
};

StyledRadioList.displayName = 'StyledRadioList';

export default StyledRadioList;
