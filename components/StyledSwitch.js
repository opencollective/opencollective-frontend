import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { typography } from 'styled-system';

const CheckboxContainer = styled.div`
  position: relative;
  display: flex;
  align-items: ${props => props.alignItems};
  line-height: 1.4em;
  cursor: pointer;
  ${typography}
  width: ${props => props.width};

  &:disabled {
    cursor: not-allowed;
  }

  // Based on https://github.com/argyleink/gui-challenges/blob/main/switch/style.css
  input {
    --thumb-size: ${props => props.size};
    --thumb: hsl(0 0% 100%);
    --thumb-highlight: hsl(0 0% 0% / 25%);

    --track-size: calc(var(--thumb-size) * 2);
    --track-padding: 3px;
    --track-inactive: #9ea0a3;
    --track-active: linear-gradient(180deg, #25b869 0%, #128045 100%);

    --thumb-color: var(--thumb);
    --thumb-color-highlight: var(--thumb-highlight);
    --track-color-inactive: var(--track-inactive);
    --track-color-active: var(--track-active);

    --isLTR: 1;
    --thumb-position: '%0';
    --thumb-transition-duration: 0.25s;

    padding: var(--track-padding);
    background: var(--track-color-inactive);
    inline-size: var(--track-size);
    block-size: var(--thumb-size);
    border-radius: var(--track-size);

    appearance: none;
    pointer-events: none;
    touch-action: pan-y;
    border: none;
    outline-offset: 5px;
    box-sizing: content-box;

    flex-shrink: 0;
    display: grid;
    align-items: center;
    grid: [track] 1fr / [track] 1fr;

    transition: background-color 0.25s ease;

    &::before {
      --highlight-size: 0;

      content: '';
      cursor: pointer;
      pointer-events: auto;
      grid-area: track;
      inline-size: var(--thumb-size);
      block-size: var(--thumb-size);
      background: var(--thumb-color);
      box-shadow: 0 0 0 var(--highlight-size) var(--thumb-color-highlight);
      border-radius: 50%;
      transform: translateX(var(--thumb-position));
      transition: transform var(--thumb-transition-duration) ease, box-shadow 0.25s ease;

      @media (prefers-reduced-motion) {
        transition: unset;
      }
    }

    &:not(:disabled):hover::before {
      --highlight-size: 0.5rem;
    }

    &:checked {
      background: var(--track-color-active);
      --thumb-position: calc((var(--track-size) - 100%) * var(--isLTR));
    }

    ${props =>
      props.isLoading
        ? '--thumb-position: calc(calc(calc(var(--track-size) / 2) - calc(var(--thumb-size) / 2)) * var(--isLTR)) !important;'
        : ''};

    &:disabled {
      cursor: not-allowed;
      --thumb-color: transparent;

      &::before {
        cursor: not-allowed;
        box-shadow: inset 0 0 0 2px hsl(0 0% 100% / 50%);

        @media (prefers-color-scheme: dark) {
          & {
            box-shadow: inset 0 0 0 2px hsl(0 0% 0% / 50%);
          }
        }
      }
    }
  }
`;

class StyledSwitch extends React.Component {
  constructor(props) {
    super(props);
    this.state = { checked: props.defaultChecked };
  }

  async onChange(newValue) {
    const { name, checked, onChange, disabled, isLoading } = this.props;

    if (disabled || isLoading) {
      return false;
    }

    if (onChange) {
      await Promise.resolve(
        onChange({ name, checked: newValue, type: 'checkbox', target: { name, value: newValue, checked: newValue } }),
      );
    }

    if (checked === undefined) {
      this.setState({ checked: newValue });
    }
  }

  render() {
    const { name, checked, disabled, size, inputId, width, alignItems, isLoading, fontSize } = this.props;
    const realChecked = checked === undefined ? this.state.checked : checked;

    return (
      <CheckboxContainer
        role="button"
        tabIndex={0}
        onClick={() => this.onChange(!realChecked)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.onChange(!realChecked);
          }
        }}
        fontSize={fontSize || size}
        size={size}
        width={width}
        alignItems={alignItems}
        data-cy={`switch-${name}`}
        isLoading={isLoading}
      >
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={realChecked}
          disabled={disabled || isLoading}
          tabIndex={-1}
          readOnly
        />
      </CheckboxContainer>
    );
  }
}

StyledSwitch.defaultProps = {
  size: '14px',
  defaultChecked: false,
  width: 'auto',
  alignItems: 'center',
};

StyledSwitch.propTypes = {
  /** The name of the input */
  name: PropTypes.string.isRequired,
  /** Called when state change with an object like { name, checked, type, target: { value } }*/
  onChange: PropTypes.func,
  /** Whether the checkbox is checked. Use it to control the component. If not provided, component will maintain its own state. */
  checked: PropTypes.bool,
  /** Whether the checkbox should be checked by default. Ignored if `checked` is provided. */
  defaultChecked: PropTypes.bool,
  /** And optional ID for the `<input/>` */
  inputId: PropTypes.string,
  /** Whether checkbox should be disabled */
  disabled: PropTypes.bool,
  /** An optional size */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** Set this to 'auto' to not take the full width */
  width: PropTypes.string,
  /** If true, the checkbox will be replaced by a spinner */
  isLoading: PropTypes.bool,
  /** Default to center */
  alignItems: PropTypes.string,
  error: PropTypes.any,
};

export default StyledSwitch;
