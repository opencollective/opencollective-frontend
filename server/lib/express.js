import bodyParser from 'body-parser';
import config from 'config';
import connectRedis from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import debug from 'debug';
import errorHandler from 'errorhandler';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import redis from 'redis';
import session from 'express-session';

import cloudflareIps from 'cloudflare-ip/ips.json';
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as MeetupStrategy } from 'passport-meetup-oauth2';
import { has, get } from 'lodash';

import forest from './forest';
import cacheMiddleware from '../middleware/cache';
import { loadersMiddleware } from '../graphql/loaders';
import { sanitizeForLogs } from '../lib/utils';

export default function(app) {
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

  app.use(helmet());

  // Loaders are attached to the request to batch DB queries per request
  // It also creates in-memory caching (based on request auth);
  app.use(loadersMiddleware);

  if (process.env.DEBUG && process.env.DEBUG.match(/response/)) {
    app.use((req, res, next) => {
      const temp = res.end;
      res.end = function(str) {
        try {
          const obj = JSON.parse(str);
          debug('response')(JSON.stringify(obj, null, '  '));
        } catch (e) {
          debug('response', str);
        }
        temp.apply(this, arguments);
      };
      next();
    });
  }

  // Log requests if enabled (default false)
  if (get(config, 'log.accessLogs')) {
    app.use(morgan('combined'));
  }

  // Body parser.
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // check for slow requests
  app.use((req, res, next) => {
    req.startAt = new Date();
    const temp = res.end;

    res.end = function() {
      const timeElapsed = new Date() - req.startAt;
      if (timeElapsed > (process.env.SLOW_REQUEST_THRESHOLD || 1000)) {
        if (req.body && req.body.query) {
          console.log(
            `>>> slow request ${timeElapsed}ms`,
            req.body.operationName,
            'query:',
            req.body.query.substr(0, req.body.query.indexOf(')') + 1),
          );
          if (req.body.variables) {
            console.log('>>> variables: ', sanitizeForLogs(req.body.variables));
          }
        }
      }
      temp.apply(this, arguments);
    };
    next();
  });

  // Cache Middleware
  if (get(config, 'cache.middleware')) {
    app.use(cacheMiddleware());
  }

  // Error handling.
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    app.use(errorHandler());
  }

  // Forest
  forest(app);

  // Cors.
  app.use(cors());

  const verify = (accessToken, tokenSecret, profile, done) => done(null, accessToken, { tokenSecret, profile });

  if (has(config, 'github.clientID') && has(config, 'github.clientSecret')) {
    passport.use(new GitHubStrategy(get(config, 'github'), verify));
  } else {
    console.warn('Configuration missing for passport GitHubStrategy, skipping.');
  }
  if (has(config, 'meetup.clientID') && has(config, 'meetup.clientSecret')) {
    passport.use(new MeetupStrategy(get(config, 'meetup'), verify));
  } else {
    console.warn('Configuration missing for passport MeetupStrategy, skipping.');
  }
  if (has(config, 'twitter.consumerKey') && has(config, 'twitter.consumerSecret')) {
    passport.use(new TwitterStrategy(get(config, 'twitter'), verify));
  } else {
    console.warn('Configuration missing for passport TwitterStrategy, skipping.');
  }

  app.use(cookieParser());

  // Setup session (required by passport)

  let store;
  if (get(config, 'redis.serverUrl')) {
    const RedisStore = connectRedis(session);
    store = new RedisStore({ client: redis.createClient(get(config, 'redis.serverUrl')) });
  }

  app.use(
    session({
      store,
      secret: config.keys.opencollective.sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
}
