import config from 'config';
import winston, { format } from 'winston';

const logger = winston.createLogger();

const winstonLevel = config.log.level;

const winstonFormat = format.combine(format.colorize(), format.splat(), format.simple());

const winstonConsole = new winston.transports.Console({
  level: winstonLevel,
  format: winstonFormat,
});

logger.add(winstonConsole);
logger.exceptions.handle(winstonConsole);

export default logger;
