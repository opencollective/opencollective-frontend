import '../env';
import 'raf/polyfill';
import '@testing-library/jest-dom';

// eslint-disable-next-line n/no-extraneous-import
import { jest } from '@jest/globals';

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);

// Polyfill for libraries (e.g., Radix/cmdk) that rely on ResizeObserver in jsdom
// @ts-expect-error - global.ResizeObserver is not defined
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// JSDOM doesn't implement scrollIntoView
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = jest.fn();
}
