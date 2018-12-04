import bodyParser from 'body-parser';
import config from 'config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import errorHandler from 'errorhandler';
import passport from 'passport';
import connectSessionSequelize from 'connect-session-sequelize';
import session from 'express-session';
import helmet from 'helmet';
import debug from 'debug';
import cloudflareIps from 'cloudflare-ip/ips.json';
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as MeetupStrategy } from 'passport-meetup-oauth2';
import { has, get } from 'lodash';

import forest from './forest';
import cacheMiddleware from '../middleware/cache';
import { sequelize as db } from '../models';
import { middleware } from '../graphql/loaders';
import { sanitizeForLogs } from '../lib/utils';

const SequelizeStore = connectSessionSequelize(session.Store);

export default function(app) {
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

  app.use(helmet());

  // Loaders are attached to the request to batch DB queries per request
  // It also creates in-memory caching (based on request auth);
  app.use(middleware);

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
  if (get(config, 'logs.accessLogs')) {
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

  // Cors.
  app.use(cors());

  // Cache Middleware
  if (get(config, 'cache.middleware')) {
    app.use(cacheMiddleware());
  }

  app.use(multer());

  // Error handling.
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    app.use(errorHandler());
  }

  // Forest
  forest(app);

  // Authentication

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((obj, cb) => cb(null, obj));

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
  app.use(
    session({
      secret: config.keys.opencollective.sessionSecret,
      resave: false,
      cookie: { maxAge: 1000 * 60 * 5 },
      saveUninitialized: false,
      store: new SequelizeStore({ db }),
      proxy: true,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}
