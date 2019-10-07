const winston = require('winston');

function getLogLevel() {
  if (process.env.DEBUG) {
    return 'debug';
  } else if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'circleci') {
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
