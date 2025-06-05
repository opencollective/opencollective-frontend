import React from 'react';
import PropTypes from 'prop-types';

export default class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    const { children } = this.props;
    return <main>{children}</main>;
  }
}
