const winston = require('winston');

function getLogLevel() {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  } else if (['test', 'e2e', 'ci'].includes(process.env.OC_ENV)) {
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
