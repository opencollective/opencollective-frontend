const winston = require('winston');

function getLogLevel() {
  if (process.env.DEBUG) {
    return 'debug';
  } else if (['test', 'ci', 'circleci'].includes(process.env.NODE_ENV)) {
    return 'warn';
  } else {
    return 'info';
  }
}

const logger = winston.createLogger();

const winstonConsole = new winston.transports.Console({
  level: getLogLevel(),
  format: winston.format.combine(winston.format.colorize(), winston.format.splat(), winston.format.simple()),
});

logger.add(winstonConsole);
logger.exceptions.handle(winstonConsole);

module.exports = logger;
