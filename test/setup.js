import '../env';
import 'raf/polyfill';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;
const { document } = new JSDOM('<!doctype html><html><body></body></html>').window;
global.document = document;
global.window = document.defaultView;
global.window.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
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

Enzyme.configure({ adapter: new Adapter() });
