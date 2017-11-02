import 'newrelic';
import express from 'express';
import next from 'next';
import routes from './routes';
import { loggerMiddleware, logger } from './logger';
import accepts from 'accepts';
import { getLocaleDataScript, getMessages, languages } from './intl';

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development');
const server = express();
const app = next({ dev, dir: dev ? 'src' : 'build' });
server.next = app;

const port = process.env.PORT || 3000;

app.prepare()
.then(() => {

  server.use(loggerMiddleware.logger);

  // allow the frontend to log errors to papertrail
  server.get('/log/:type', (req, res) => {
    logger[req.params.type](req.query.message);
    res.send('ok');
  });

  server.use((req, res, next) => {
    const accept = accepts(req)
    const locale = accept.language(languages)  || 'en';
    console.log(">>> url", req.url, "locale", locale);
    req.locale = locale;
    req.localeDataScript = getLocaleDataScript(locale)
    req.messages = getMessages(locale)
    // req.messages = dev ? {} : getMessages(locale)
    next();
  });

  server.use(routes(server, app));
  server.use(loggerMiddleware.errorLogger);
  server.listen(port, (err) => {
    if (err) {
      logger.error(">> Error when starting server", err);
      throw err
    }
    logger.info(`>> Ready on http://localhost:${port} in ${env} environment`);
  })
})