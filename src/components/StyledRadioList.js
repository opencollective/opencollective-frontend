import React from 'react';
import PropTypes from 'prop-types';
import { withState } from 'recompose';
import { find } from 'lodash';

import { Box } from '@rebass/grid';
import { getItems } from './StyledSelect';
import Container from './Container';

const getKeyExtractor = keyGetter => {
  if (typeof keyGetter === 'string') {
    return item => item[keyGetter];
  } else if (typeof keyGetter === 'function') {
    return keyGetter;
  }

  return item => JSON.stringify(item);
};

const enhance = withState('selected', 'setSelected', ({ defaultValue }) => defaultValue);

/**
 * Component for controlling a list of radio inputs
 */
const StyledRadioList = enhance(
  ({ children, defaultValue, id, name, onChange, options, selected, setSelected, keyGetter }) => {
    const keyExtractor = getKeyExtractor(keyGetter);
    const items = getItems(options, keyGetter);

    return (
      <Container
        as="fieldset"
        border="none"
        m={0}
        p={0}
        onChange={({ target }) => {
          const selectedItem = find(items, item => item.key === target.value);
          onChange({ type: 'fieldset', name, key: selectedItem.key, value: selectedItem.value });
          setSelected(target.value);
        }}
        id={id}
      >
        {items.map((item, index) => (
          <Container as="label" display="block" htmlFor={id && item.key + id} key={item.key} width={1} m={0}>
            {children({
              ...item,
              checked: selected && keyExtractor(item) === selected,
              index,
              radio: (
                <input
                  type="radio"
                  name={name}
                  id={id && item.key + id}
                  value={item.key}
                  defaultChecked={defaultValue && keyExtractor(defaultValue) === selected}
                />
              ),
            })}
          </Container>
        ))}
      </Container>
    );
  },
);

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
};

const defaultChild = ({ value, radio }) => (
  <Box mb={2}>
    <Box as="span" mr={2}>
      {radio}
    </Box>
    {value}
  </Box>
);

StyledRadioList.defaultProps = {
  children: defaultChild,
  onChange: () => {}, // noop
};

StyledRadioList.displayName = 'StyledRadioList';

export default StyledRadioList;
