const expressWinston = require('express-winston');

const logger = require('./logger');

const loggerMiddleware = {
  logger: expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    colorize: true,
    expressFormat: true,
    ignoreRoute: req => req.url.match(/^\/_/),
  }),
  errorLogger: expressWinston.errorLogger({
    winstonInstance: logger,
  }),
};

module.exports = loggerMiddleware;
