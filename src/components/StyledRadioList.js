import PropTypes from 'prop-types';
import { withState } from 'recompose';

import { Box } from '@rebass/grid';
import { getItems } from './StyledSelect';
import Container from './Container';

const matches = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const enhance = withState('selected', 'setSelected', ({ defaultValue }) => defaultValue);

/**
 * Component for controlling a list of radio inputs
 */
const StyledRadioList = enhance(({ children, defaultValue, id, name, onChange, options, selected, setSelected }) => (
  <Container
    as="fieldset"
    border="none"
    m={0}
    p={0}
    onChange={({ target }) => {
      onChange(target.value);
      setSelected(target.value);
    }}
    id={id}
  >
    {getItems(options).map((item, index) => (
      <Container as="label" display="block" htmlFor={item.key + id} key={item.key} width={1}>
        {children({
          ...item,
          checked: matches(selected, item.key),
          index,
          radio: (
            <input
              type="radio"
              name={name}
              id={item.key + id}
              value={item.key}
              defaultChecked={matches(item.key, defaultValue)}
            />
          ),
        })}
      </Container>
    ))}
  </Container>
));

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
  id: PropTypes.string,
  /** element name for radio inputs */
  name: PropTypes.string.isRequired,
  /** event handler for when a selection is made */
  onChange: PropTypes.func,
  /** list or map of options to display */
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.shape()])),
  ]).isRequired,
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
