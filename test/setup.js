import '../env';
import 'raf/polyfill';

import registerRequireContextHook from 'babel-plugin-require-context-hook/register';
import jsdom from 'jsdom';

registerRequireContextHook();

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
