import React from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

export const mockedRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  route: '/mock-route',
  pathname: '/mock-path',
};

Router.router = mockedRouter;

export const withMockRouterContext = mockRouter => {
  class MockRouterContext extends React.Component {
    getChildContext() {
      return {
        router: Object.assign(mockedRouter, mockRouter),
      };
    }

    render() {
      return this.props.children;
    }
  }

  MockRouterContext.propTypes = {
    children: PropTypes.node.isRequired,
  };

  MockRouterContext.childContextTypes = {
    router: PropTypes.object,
  };

  return MockRouterContext;
};
