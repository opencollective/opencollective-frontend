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
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as MeetupStrategy } from 'passport-meetup-oauth2';
import { sequelize as db } from '../models';
import debug from 'debug';

const SequelizeStore = connectSessionSequelize(session.Store);

export default function(app) {
  app.use(helmet());

  if (process.env.DEBUG && process.env.DEBUG.match(/response/)) {
    app.use((req, res, next) => {
      const temp = res.send
      res.send = function(str) {
        try {
          const obj = JSON.parse(str);
          debug('response')(JSON.stringify(obj, null, '  '));
        } catch (e) {
          debug('response', str);
        }
        temp.apply(this,arguments);
      }
      next();
    });
  }

  // Body parser.
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(multer());

  // Cors.
  app.use(cors());

  // Logs.
  app.use(morgan('dev'));

  // Error handling.
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    app.use(errorHandler());
  }

  // Authentication

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((obj, cb) => cb(null, obj));

  const verify = (accessToken, tokenSecret, profile, done) => done(null, accessToken, { tokenSecret, profile });
  passport.use(new GitHubStrategy(config.github, verify));
  passport.use(new MeetupStrategy(config.meetup, verify));
  passport.use(new TwitterStrategy(config.twitter, verify));

  app.use(cookieParser());
  app.use(session({
    secret: 'my_precious',
    resave: false,
    cookie: { maxAge: 1000 * 60 * 5 },
    saveUninitialized: false,
    store: new SequelizeStore({ db }),
    proxy: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}
