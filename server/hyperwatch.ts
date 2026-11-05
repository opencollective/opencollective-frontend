import hyperwatch from '@hyperwatch/hyperwatch';
import expressBasicAuth from 'express-basic-auth';

import logger from './logger.ts';
import redisProvider from './redis-provider.ts';
import { parseToBooleanDefaultFalse } from './utils.ts';

const {
  HYPERWATCH_ENABLED: enabled,
  HYPERWATCH_PATH: path,
  HYPERWATCH_USERNAME: username,
  HYPERWATCH_SECRET: secret,
  REDIS_URL: redisServerUrl,
} = process.env;

const load = async (app, { server, fallback }) => {
  if (parseToBooleanDefaultFalse(enabled) !== true) {
    return false;
  }

  const { input, lib, modules, pipeline, cache } = hyperwatch;

  if (redisServerUrl) {
    const provider = await redisProvider();
    cache.setProvider(provider);
  }

  // Init

  hyperwatch.init({
    modules: {
      // Expose the status page
      status: { active: true },
      // Expose logs (HTTP and Websocket)
      logs: { active: true },
      // Extract IP address without complex fuss
      cloudflare: { active: true },
      // Parse User Agent
      agent: { active: true },
      // Get hostname (reverse IP) and verify it
      hostname: { active: true },
      // Compute identity (requires agent and hostname)
      identity: { active: true },
    },
  });

  // Mount Hyperwatch API and Websocket

  if (secret) {
    hyperwatch.app.mount(app, {
      server,
      path: path || '/_hyperwatch',
      middleware: expressBasicAuth({
        users: { [username || 'opencollective']: secret },
        challenge: true,
      }),
      fallback,
    });
  }

  // Configure input

  const expressInput = input.express.create({ name: 'Hyperwatch Express Middleware' });

  app.use((req, res, next) => {
    // `req.ip` is a getter-only property on Express's request prototype, so plain
    // assignment throws in strict mode (ESM). Shadow it with a fallback instead.
    // Fix "Invalid message: data.request should have required property 'address'"
    if (!req.ip) {
      Object.defineProperty(req, 'ip', { value: '::1', configurable: true, enumerable: true, writable: true });
    }
    next();
  });

  app.use(expressInput.middleware());

  app.use((req, res, next) => {
    req.hyperwatch.getIdentityOrIp = async () => {
      let log = req.hyperwatch.augmentedLog;
      if (!log) {
        log = req.hyperwatch.augmentedLog = await req.hyperwatch.getAugmentedLog({ fast: true });
      }
      return log.getIn(['identity']) || log.getIn(['request', 'address']);
    };
    req.hyperwatch.getIdentity = async () => {
      let log = req.hyperwatch.augmentedLog;
      if (!log) {
        log = req.hyperwatch.augmentedLog = await req.hyperwatch.getAugmentedLog({ fast: true });
      }
      return log.getIn(['identity']);
    };
    next();
  });

  pipeline.registerInput(expressInput);

  // Filter 'main' node

  pipeline
    .getNode('main')
    .filter(log => !log.getIn(['request', 'url']).match(/^\/_/))
    .filter(log => !log.getIn(['request', 'url']).match(/^\/static/))
    .filter(log => !log.getIn(['request', 'url']).match(/^\/api/))
    .registerNode('main');

  // Configure access Logs in dev and production

  const consoleLogOutput = process.env.OC_ENV === 'development' ? 'console' : 'text';
  pipeline.getNode('main').map(log => logger.info(lib.logger.defaultFormatter.format(log, consoleLogOutput)));

  // Start

  modules.start();

  pipeline.start();

  return Boolean(secret);
};

export default load;
