import { errorLogger } from 'express-winston';

import logger from './logger.ts';

const loggerMiddleware = {
  errorLogger: errorLogger({
    winstonInstance: logger,
  }),
};

export default loggerMiddleware;
