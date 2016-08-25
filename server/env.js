var NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
  NODE_ENV = process.env.NODE_ENV = 'development';
}

require('./lib/load-dot-env');
