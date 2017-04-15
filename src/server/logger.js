import winston from 'winston';

require('winston-papertrail').Papertrail;
const winstonPapertrail = new winston.transports.Papertrail({
	host: 'logs5.papertrailapp.com',
	port: 35586
});

winstonPapertrail.on('error', () => {
// Handle, report, or silently ignore connection errors and failures
});

winston.handleExceptions(winstonPapertrail);

const logger = new winston.Logger({
  transports: [winstonPapertrail]
});

module.exports = logger;