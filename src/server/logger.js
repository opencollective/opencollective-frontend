import winston from 'winston';
import expressWinston from 'express-winston';

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
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.simple()
  )
});

logger.add(winstonConsole)
logger.exceptions.handle(winstonConsole);

const loggerMiddleware = {
  logger: expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    colorize: true,
    expressFormat: true,
    ignoreRoute: req => req.url.match(/^\/_/)
  }),
  errorLogger: expressWinston.errorLogger({
    winstonInstance: logger
  })
}

module.exports = { logger, loggerMiddleware };
