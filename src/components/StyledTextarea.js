import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as styledSystem from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { omit } from 'lodash';

import { overflow, resize } from '../lib/styled_system_custom';

const TextArea = styled.textarea`
  /** Size */
  ${styledSystem.space}
  ${styledSystem.width}
  ${styledSystem.height}
  ${styledSystem.minWidth}
  ${styledSystem.maxWidth}
  ${styledSystem.minHeight}
  ${styledSystem.maxHeight}
  ${resize}
  ${overflow}

  /** Borders */
  ${styledSystem.borders}
  ${styledSystem.borderRadius}
  ${styledSystem.borderColor}

  /** Text */
  ${styledSystem.color}
  ${styledSystem.fontSize}
  ${styledSystem.fontWeight}
  ${styledSystem.letterSpacing}
  ${styledSystem.lineHeight}
  ${styledSystem.textAlign}

  outline: none;

  &:disabled {
    background-color: ${themeGet('colors.black.50')};
    cursor: not-allowed;
  }

  &:focus, &:hover:not(:disabled) {
    border-color: ${themeGet('colors.primary.300')};
  }

  &::placeholder {
    color: ${themeGet('colors.black.400')};
  }
`;

/**
 * A styled textarea that can grows with its content.
 */
export default class StyledTextarea extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    /** If true, the component will update its size based on its content */
    autoSize: PropTypes.bool,
    /** styled-system prop: accepts any css 'border' value */
    border: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** styled-system prop: accepts any css 'border-color' value */
    borderColor: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** styled-system prop: accepts any css 'border-radius' value */
    borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** If not provided, the value will be set to `none` if `autoSize` is true, `vertical` otherwise */
    resize: PropTypes.oneOf(['vertical', 'horizontal', 'both', 'none']),
    /** @ignore */
    px: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    /** @ignore */
    py: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  };

  static defaultProps = {
    border: '1px solid',
    borderColor: 'black.300',
    borderRadius: '4px',
    px: 3,
    py: 2,
  };

  constructor(props) {
    super(props);
    this.textareaRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.autoSize) {
      this._adjustHeight(this.textareaRef.current);
    }
  }

  _handleChange = e => {
    this.props.onChange(e);
    if (this.props.autoSize) {
      this._adjustHeight(e.target);
    }
  };

  _adjustHeight(target) {
    // Reset height to 0 so component will auto-size
    target.style.height = 0;
    // Use the scroll height to define size
    target.style.height = `${target.scrollHeight}px`;
  }

  render() {
    return (
      <TextArea
        ref={this.textareaRef}
        as="textarea"
        onChange={this._handleChange}
        resize={this.props.resize || (this.props.autoSize ? 'none' : 'vertical')}
        {...omit(this.props, ['onChange', 'autoSize'])}
      />
    );
  }
}
