import React from 'react';

export default class Body extends React.Component {
  render() {
    const { children } = this.props;
    return <main>{children}</main>;
  }
}
