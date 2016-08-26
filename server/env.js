let { NODE_ENV } = process.env;

if (!NODE_ENV) {
  NODE_ENV = process.env.NODE_ENV = 'development';
}

import './lib/load-dot-env';
