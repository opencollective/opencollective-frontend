import React from 'react';
import PropTypes from 'prop-types';

import StyledLinkButton from './StyledLinkButton';

export class CustomToggle extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    children: PropTypes.node,
  };

  constructor(props, context) {
    super(props, context);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.onClick(e);
  }

  render() {
    return <StyledLinkButton onClick={this.handleClick}>{this.props.children}</StyledLinkButton>;
  }
}
