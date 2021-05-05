import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Main = styled.main`
  border-top: 1px solid rgb(232, 233, 235);
`;

export default class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    const { children } = this.props;
    return <Main>{children}</Main>;
  }
}
