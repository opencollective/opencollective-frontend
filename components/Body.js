import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

const Main = styled.main`
  ${props =>
    props.withBorderTop &&
    css`
      border-top: 1px solid rgb(232, 233, 235);
    `}

  ${props =>
    !props.withoutGlobalStyles &&
    css`
      height: 100%;
      width: 100%;
      font-family: 'Inter', sans-serif;
      letter-spacing: -0.4px;
      font-weight: 300;
      font-size: 1.6rem;
      line-height: 1.5;
      margin: 0;
      padding: 0;

      a {
        text-decoration: none;
        cursor: pointer;
      }

      h2,
      h3 {
        letter-spacing: -0.4px;
      }

      button {
        cursor: pointer;
      }

      .content {
        max-width: 1260px;
        padding: 2rem 30px;
        margin: 0 auto;
        line-height: 1.5;
        overflow: hidden;
      }

      .content p {
        text-overflow: ellipsis;
        margin: 1.5rem 0;
      }

      .content h2 {
        font-size: 1.8rem;
      }

      .content h3 {
        font-size: 1.7rem;
      }

      .content h4 {
        font-size: 1.6rem;
      }

      .content h5 {
        font-size: 1.5rem;
      }

      .content > ul {
        padding-left: 3rem;
      }

      .content ul p {
        display: initial;
      }

      .content li {
        margin: 1rem 0;
        text-align: left;
      }

      .content img {
        max-width: 100%;
      }

      .content code {
        background-color: #f6f8fa;
        padding: 0.5rem;
        overflow: scroll;
        max-width: 100%;
      }

      .content code:first-child:last-child {
        display: inline;
        padding: 1rem;
      }

      @media (max-width: 420px) {
        .content {
          padding: 1rem 1.5rem;
        }
      }
    `}
`;

export default class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    withoutGlobalStyles: PropTypes.bool,
    withBorderTop: PropTypes.bool,
  };

  static defaultProps = {
    withoutGlobalStyles: true,
    withBorderTop: true,
  };

  render() {
    const { children, withBorderTop, withoutGlobalStyles } = this.props;
    return (
      <Main withBorderTop={withBorderTop} withoutGlobalStyles={withoutGlobalStyles}>
        {children}
      </Main>
    );
  }
}
