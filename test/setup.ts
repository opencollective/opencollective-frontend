import '../env';
import 'raf/polyfill';
import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'util';

// eslint-disable-next-line n/no-extraneous-import
import { jest } from '@jest/globals';

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);
// Jest runs in a CJS environment here, while uuid@13 ships as ESM-only (`type: module`), so importing it directly
// causes "Unexpected token 'export'" during tests. Mocking keeps us off the ESM entrypoint and still provides a
// stable UUID for snapshots/keys. Other options considered:
// 1) add a Jest transform to transpile `uuid` from `node_modules`, which adds build cost and can have wider implications;
// 2) switch call sites to the CJS build (e.g. deep import), which couples us to internal paths;
// 3) downgrade `uuid` or adjust Jest to run in ESM mode, both heavier changes for a test-only issue.
jest.mock('uuid', () => {
  // Use Node's native UUID generator when available to keep behavior realistic.
  const { randomUUID } = require('crypto');
  return { v4: () => (typeof randomUUID === 'function' ? randomUUID() : '00000000-0000-0000-0000-000000000000') };
});

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
