import '../env';
import 'raf/polyfill';
import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'util';

// eslint-disable-next-line n/no-extraneous-import
import { jest } from '@jest/globals';

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);

// Mock apollo-upload-client ESM module for Jest
jest.mock('apollo-upload-client/UploadHttpLink.mjs', () => ({
  __esModule: true,
  default: class UploadHttpLink {},
}));

// Apollo Client v4 moved MockedProvider to @apollo/client/testing/react
jest.mock('@apollo/client/testing', () => {
  const testing = jest.requireActual('../node_modules/@apollo/client/__cjs/testing/index.cjs') as Record<
    string,
    unknown
  >;
  const { MockedProvider } = jest.requireActual('../node_modules/@apollo/client/__cjs/testing/react/index.cjs') as {
    MockedProvider: unknown;
  };

  return {
    ...testing,
    MockedProvider,
  };
});
jest.mock('jose', () => ({
  decodeJwt: jest.fn(() => ({})),
  SignJWT: jest.fn(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    sign: jest.fn(() => Promise.resolve('mock-token')),
  })),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
  }),
  withRouter: (Component: any) => Component,
  default: {
    router: {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    },
  },
}));

// Polyfill for libraries (e.g., Radix/cmdk) that rely on ResizeObserver in jsdom
// @ts-expect-error - global.ResizeObserver is not defined
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// For OTPLib
global.TextDecoder = TextDecoder;
// @ts-expect-error - global.TextEncoder is not defined
global.TextEncoder = TextEncoder;

// JSDOM doesn't implement scrollIntoView
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = jest.fn();
}
