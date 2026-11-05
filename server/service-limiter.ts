import debug from 'debug';

import logger from './logger.ts';

const nonEssentialRobots = ['Ahrefs', 'Bluechip Backlinks', 'PetalBot', 'Semrush', 'Shenma', 'SpiderFoot', 'WebMeUp'];

const essentialRobots = ['Facebook', 'Pingdom', 'Twitter'];

const debugServiceLevel = debug('serviceLevel');

let serviceLevel = 0;

function increaseServiceLevel(newLevel: number): void {
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

async function serviceLimiterMiddleware(req, res, next): Promise<void> {
  if (!req.identity && req.hyperwatch) {
    req.identity = await req.hyperwatch.getIdentity();
  }
  if (serviceLevel < 100) {
    if (req.identity && nonEssentialRobots.includes(req.identity)) {
      onServiceLimited(req, res);
      return;
    }
  }
  if (serviceLevel < 50) {
    if (req.identity && !essentialRobots.includes(req.identity)) {
      onServiceLimited(req, res);
      return;
    }
  }
  next();
}

export { serviceLimiterMiddleware, increaseServiceLevel };
