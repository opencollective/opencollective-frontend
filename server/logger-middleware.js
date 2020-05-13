const expressWinston = require('express-winston');

const logger = require('./logger');

const loggerMiddleware = {
  logger: expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    colorize: true,
    msg: `{{req.ip}} {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms - {{req.headers['user-agent']}}`,
    ignoreRoute: req => req.url.match(/^\/_/),
  }),
  errorLogger: expressWinston.errorLogger({
    winstonInstance: logger,
  }),
};

module.exports = loggerMiddleware;
