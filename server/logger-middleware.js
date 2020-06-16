const expressWinston = require('express-winston');

const logger = require('./logger');

const loggerMiddleware = {
  errorLogger: expressWinston.errorLogger({
    winstonInstance: logger,
  }),
};

module.exports = loggerMiddleware;
