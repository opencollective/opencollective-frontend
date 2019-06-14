import React from 'react';
import PropTypes from 'prop-types';

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
    return (
      <a href="" onClick={this.handleClick}>
        {this.props.children}
      </a>
    );
  }
}
