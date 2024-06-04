import '../env';
import 'raf/polyfill';

import jsdom from 'jsdom';

const { JSDOM } = jsdom;
const url = 'http://localhost';
const { document } = new JSDOM('<!doctype html><html><body></body></html>', { url }).window;
global.document = document;
global.window = document.defaultView;
global.navigator = {
  userAgent: 'node.js',
};

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .reduce(
      (result, prop) => ({
        ...result,
        [prop]: Object.getOwnPropertyDescriptor(src, prop),
      }),
      {},
    );
  Object.defineProperties(target, props);
}
copyProps(document.defaultView, global);

// The `supported-languages` file relies on require.context which is not available in Jest
jest.mock('../lib/i18n/supported-languages', () => ['en']);
