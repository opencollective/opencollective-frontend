import winston from 'winston';
import expressWinston from 'winston-express-middleware';
require('winston-papertrail').Papertrail;

const winstonConsole = new winston.transports.Console({
  json: false,
  colorize: true
});

const winstonPapertrail = new winston.transports.Papertrail({
	host: 'logs5.papertrailapp.com',
	port: 35586
});

const transports = [winstonConsole];
if (process.env.NODE_ENV === 'production') {
  transports.push(winstonPapertrail);
}

winstonPapertrail.on('error', () => {
  // Handle, report, or silently ignore connection errors and failures
  console.error("Coulnd't connect to papertrail");
});

winston.handleExceptions(transports);

const logger = new winston.Logger( { transports } );

const loggerMiddleware = {
  logger: expressWinston.logger({
      transports,
      meta: false, // optional: control whether you want to log the meta data about the request (default to true) 
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}" 
      expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true 
      colorStatus: true, // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true 
      ignoreRoute: (req) => {
         // optional: allows to skip some log messages based on request and/or response 
        if (req.url.match(/^\/_/)) return true;
        return false;
      }
    }),
    errorLogger: expressWinston.errorLogger( { transports })
}

module.exports = { logger, loggerMiddleware };