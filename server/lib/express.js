const bodyParser = require('body-parser');
const config = require('config');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

const SequelizeStore = require('connect-session-sequelize')(session.Store);

module.exports = function(app) {

  const Sequelize = app.get('models').sequelize;

  // Body parser.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());

  // Cors.
  app.use(cors());

  // Logs.
  app.use(morgan('dev'));

  // Error handling.
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    app.use(require('errorhandler')());
  }

  // Authentication

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((obj, cb) => cb(null, obj));

  passport.use(new GitHubStrategy(config.github,
    (accessToken, refreshToken, profile, done) => done(null, accessToken, { profile })));

  passport.use(new TwitterStrategy(config.twitter,
    (accessToken, tokenSecret, profile, done) => done(null, accessToken, { tokenSecret, profile })));

  app.use(cookieParser());
  app.use(session({
    secret: 'my_precious',
    resave: false,
    cookie: { maxAge: 1000 * 60 * 5 },
    saveUninitialized: false,
    store: new SequelizeStore({ db: Sequelize }),
    proxy: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
};
