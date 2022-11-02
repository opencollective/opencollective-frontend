import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Main = styled.main`
  min-height: 74vh;
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
