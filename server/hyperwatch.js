const hyperwatch = require('@hyperwatch/hyperwatch');
const expressBasicAuth = require('express-basic-auth');
const expressWs = require('express-ws');

const { debugPerformance } = require('./debug');
const { parseToBooleanDefaultFalse } = require('./utils');

const {
  HYPERWATCH_ENABLED: enabled,
  HYPERWATCH_PATH: path,
  HYPERWATCH_USERNAME: username,
  HYPERWATCH_SECRET: secret,
} = process.env;

const load = async app => {
  if (parseToBooleanDefaultFalse(enabled) !== true) {
    return;
  }

  const { input, lib, modules, pipeline } = hyperwatch;

  // Init

  hyperwatch.init({
    modules: {
      // Expose the status page
      status: { active: true },
      // Expose logs (HTTP and Websocket)
      logs: { active: true },
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
    req.hyperwatch = req.hyperwatch || {};
    req.hyperwatch.rawLog = req.hyperwatch.rawLog || lib.util.createLog(req, res);
    req.getAugmentedLog = async () => {
      if (!req.hyperwatch.augmentedLog) {
        debugPerformance(`Hyperwatch start augment ${req.url}`);
        let log = req.hyperwatch.rawLog;
        for (const key of ['cloudflare', 'agent', 'hostname', 'identity']) {
          log = await modules.get(key).augment(log);
        }
        debugPerformance(`Hyperwatch end augment ${req.url}`);
        req.hyperwatch.augmentedLog = log;
      }
      return req.hyperwatch.augmentedLog;
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
  pipeline.getNode('main').map(log => console.log(lib.logger.defaultFormatter.format(log, consoleLogOutput)));

  // Start

  modules.beforeStart();

  pipeline.start();
};

module.exports = load;
