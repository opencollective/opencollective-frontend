import config from 'config';
import winston from 'winston';

const logger = winston.createLogger();

const winstonLevel = config.log.level;

const winstonBaseFormat = winston.format.combine(winston.format.simple(), winston.format.splat());

const winstonFormat = winston.format.combine(winston.format.colorize(), winstonBaseFormat);

const winstonConsole = new winston.transports.Console({
  level: winstonLevel,
  format: winstonFormat,
});

logger.add(winstonConsole);
logger.exceptions.handle(winstonConsole);

export default logger;
