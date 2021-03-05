import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import styled, { css } from 'styled-components';
import { size, typography } from 'styled-system';

import StyledSpinner from './StyledSpinner';
import { Label } from './Text';

const IconCheckmark = () => {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        id="checkmark-tiny"
        d="M3.30913 8C3.0158 8 2.73358 7.88442 2.52358 7.67438L0.32583 5.47599C-0.10861 5.04257 -0.10861 4.34021 0.32583 3.90569C0.760269 3.47116 1.46248 3.47116 1.89692 3.90569L3.16913 5.17835L5.98574 0.462633C6.34352 -0.0341285 7.03573 -0.149706 7.53683 0.20814C8.03572 0.565985 8.14905 1.26056 7.79128 1.75843L4.21134 7.53769C4.01245 7.81663 3.68357 8 3.30913 8Z"
      />
    </svg>
  );
};

const CustomCheckbox = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  cursor: pointer;
  border: 1px solid #dcdee0;
  border-radius: 4px;
  background-color: white;
  transition: background-color 0.2s;

  svg {
    opacity: 0;
    height: 0.572em;
    width: 0.572em;
    fill: white;
  }

  ${StyledSpinner} {
    opacity: 1;
    fill: #999999;
  }
`;

const CheckboxContainer = styled.div`
  position: relative;
  display: flex;
  align-items: ${props => props.alignItems};
  line-height: 1.4em;
  ${typography}
  width: ${props => props.width};

  /* Hide the default checkbox */
  input {
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
  }

  label {
    cursor: pointer;
    margin: 0;
    margin-left: 2.2rem;
    z-index: 9;
    font-weight: normal;
    width: auto;
  }

  /* Show our custom checkbox */
  ${CustomCheckbox} {
    ${size}
    ${props =>
      props.error &&
      css`
        border-color: ${themeGet('colors.red.500')};
      `}
  }

  /* Hover label / checkbox - only for pointer devices (ignored on touch devices) */
  @media (hover: hover) {
    &:hover input:not(:disabled):not(:checked) ~ ${CustomCheckbox} {
      background: ${themeGet('colors.primary.100')};
      border-color: ${themeGet('colors.primary.100')};
      svg {
        opacity: 1;
      }
    }
  }

  /* Checked */
  input:checked ~ ${CustomCheckbox} {
    background: ${themeGet('colors.primary.500')};
    border-color: ${themeGet('colors.primary.500')};
    svg {
      opacity: 1;
    }
    ${StyledSpinner} {
      fill: #eeeeee;
    }
  }

  /* Focused */
  input:focus ~ ${CustomCheckbox} {
    background: ${themeGet('colors.primary.400')};
    border-color: ${themeGet('colors.primary.400')};
  }

  /* Disabled */
  input:disabled {
    & ~ ${CustomCheckbox} {
      background: #f7f8fa;
      border: 1px solid #e8e9eb;
      cursor: not-allowed;
      svg {
        fill: ${themeGet('colors.primary.200')};
      }
    }
    & ~ label {
      cursor: not-allowed;
    }
  }
`;

class StyledCheckbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = { checked: props.defaultChecked };
  }

  onChange(newValue) {
    const { name, checked, onChange, disabled, isLoading } = this.props;

    if (disabled || isLoading) {
      return false;
    }

    if (checked === undefined) {
      this.setState({ checked: newValue });
    }

    if (onChange) {
      onChange({ name, checked: newValue, type: 'checkbox', target: { name, value: newValue, checked: newValue } });
    }
  }

  render() {
    const {
      name,
      checked,
      label,
      disabled,
      size,
      inputId,
      width,
      alignItems,
      isLoading,
      fontSize,
      ...props
    } = this.props;
    const realChecked = checked === undefined ? this.state.checked : checked;

    return (
      <CheckboxContainer
        onClick={() => this.onChange(!realChecked)}
        fontSize={fontSize || size}
        size={size}
        width={width}
        alignItems={alignItems}
        data-cy={`checkbox-${name}`}
        {...props}
      >
        <input id={inputId} name={name} type="checkbox" checked={realChecked} disabled={disabled} readOnly />
        <CustomCheckbox data-cy="custom-checkbox">
          {isLoading ? <StyledSpinner size={size} /> : <IconCheckmark />}
        </CustomCheckbox>
        {label && <Label htmlFor={inputId}>{label}</Label>}
      </CheckboxContainer>
    );
  }
}

StyledCheckbox.defaultProps = {
  size: '14px',
  defaultChecked: false,
  width: 'auto',
  alignItems: 'center',
};

StyledCheckbox.propTypes = {
  /** The name of the input */
  name: PropTypes.string.isRequired,
  /** Called when state change with an object like { name, checked, type, target: { value } }*/
  onChange: PropTypes.func,
  /** Wether the checkbox is checked. Use it to control the component. If not provided, component will maintain its own state. */
  checked: PropTypes.bool,
  /** Wether the checkbox should be checked by default. Ignored if `checked` is provided. */
  defaultChecked: PropTypes.bool,
  /** And optional ID for the `<input/>` */
  inputId: PropTypes.string,
  /** Wether checkbox should be disabled */
  disabled: PropTypes.bool,
  /** An optional label to display next to checkbox */
  label: PropTypes.node,
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

export default StyledCheckbox;
