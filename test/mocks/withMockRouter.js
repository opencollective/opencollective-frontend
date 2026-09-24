import Router from 'next/router';

// keep for future use?
// ts-unused-exports:disable-next-line
export const mockedRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  route: '/mock-route',
  pathname: 'mock-path',
};

Router.router = mockedRouter;
