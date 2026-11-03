import React from 'react';
import PropTypes from 'prop-types';

export default class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    style: PropTypes.object,
  };

  render() {
    const { children } = this.props;
    return (
      <main css={{ minHeight: 'calc(100vh - 530px)' }} {...this.props}>
        {children}
      </main>
    );
  }
}
