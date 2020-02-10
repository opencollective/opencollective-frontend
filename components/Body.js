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
    props.withSmoothScroll &&
    css`
      scroll-behavior: smooth;
    `}
`;

export default class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    withoutGlobalStyles: PropTypes.bool,
    withBorderTop: PropTypes.bool,
    withSmoothScroll: PropTypes.bool,
  };

  static defaultProps = {
    withoutGlobalStyles: false,
    withBorderTop: true,
    withSmoothScroll: false,
  };

  render() {
    const { children, withBorderTop, withoutGlobalStyles, withSmoothScroll } = this.props;
    return withoutGlobalStyles ? (
      <Main withBorderTop={withBorderTop}>{children}</Main>
    ) : (
      <Main withBorderTop={withBorderTop} withSmoothScroll={withSmoothScroll}>
        <style jsx global>
          {`
            main {
              height: 100%;
              width: 100%;
              font-family: 'Inter', sans-serif;
              letter-spacing: -0.4px;
              font-weight: 300;
              font-size: 1.6rem;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }

            a {
              text-decoration: none !important;
              cursor: pointer;
            }

            h1 {
              font-size: 4rem;
              letter-spacing: -1.2px;
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
        </style>
        {this.props.children}
      </Main>
    );
  }
}
