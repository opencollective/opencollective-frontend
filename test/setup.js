import '../env';
import 'raf/polyfill';

global.navigator = {
  userAgent: 'node.js',
};

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);
