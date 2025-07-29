import '../env';
import 'raf/polyfill';
import '@testing-library/jest-dom';

import { jest } from '@jest/globals';

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);
