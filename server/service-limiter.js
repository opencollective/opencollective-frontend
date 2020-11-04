const debug = require('debug');

const logger = require('./logger');

const nonEssentialRobots = ['Ahrefs', 'Bluechip Backlinks', 'Semrush', 'SpiderFoot', 'WebMeUp'];

const essentialRobots = ['Facebook', 'Pingdom', 'Twitter'];

const debugServiceLevel = debug('serviceLevel');

let serviceLevel = 0;

function increaseServiceLevel(newLevel) {
  debugServiceLevel(`Increasing service level to ${newLevel}`);
  if (newLevel > serviceLevel) {
    serviceLevel = newLevel;
  }
}

const onServiceLimited = (req, res) => {
  logger.info(`Service limited for '${req.ip}' '${req.headers['user-agent']}'`);
  const message = `Service Limited. Try again later. Please contact support@opencollective.com if it persists.`;
  res.status(503).send(message);
};

async function serviceLimiterMiddleware(req, res, next) {
  if (!req.identity && req.hyperwatch) {
    req.identity = await req.hyperwatch.getIdentity();
  }
  if (serviceLevel < 100) {
    if (req.identity && nonEssentialRobots.include(req.identity)) {
      onServiceLimited(req, res, next);
      return;
    }
  }
  if (serviceLevel < 50) {
    if (req.identity && !essentialRobots.include(req.identity)) {
      onServiceLimited(req, res, next);
      return;
    }
  }
  next();
}

module.exports = {
  serviceLimiterMiddleware,
  increaseServiceLevel,
};
