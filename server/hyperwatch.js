const hyperwatch = require('@hyperwatch/hyperwatch');
const expressBasicAuth = require('express-basic-auth');
const expressWs = require('express-ws');

const logger = require('./logger');
const redisProvider = require('./redis-provider');
const { parseToBooleanDefaultFalse } = require('./utils');

const {
  HYPERWATCH_ENABLED: enabled,
  HYPERWATCH_PATH: path,
  HYPERWATCH_USERNAME: username,
  HYPERWATCH_SECRET: secret,
  REDIS_URL: redisServerUrl,
} = process.env;

const load = async app => {
  if (parseToBooleanDefaultFalse(enabled) !== true) {
    return;
  }

  const { input, lib, modules, pipeline, cache } = hyperwatch;

  if (redisServerUrl) {
    cache.setProvider(redisProvider({ serverUrl: redisServerUrl }));
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
    // We need to setup express-ws here to make Hyperwatch's websocket works
    expressWs(app);
    const hyperwatchBasicAuth = expressBasicAuth({
      users: { [username || 'opencollective']: secret },
      challenge: true,
    });
    app.use(path || '/_hyperwatch', hyperwatchBasicAuth, hyperwatch.app.api);
    app.use(path || '/_hyperwatch', hyperwatchBasicAuth, hyperwatch.app.websocket);
  }

  // Configure input

  const expressInput = input.express.create({ name: 'Hyperwatch Express Middleware' });

  app.use((req, res, next) => {
    req.ip = req.ip || '::1'; // Fix "Invalid message: data.request should have required property 'address'"
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

  modules.beforeStart();

  pipeline.start();
};

module.exports = load;
