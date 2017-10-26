import userLib from '../lib/userlib';
import constants from '../constants/activities';
import emailLib from '../lib/email';
import models from '../models';
import errors from '../lib/errors';
import { isValidEmail } from '../lib/utils';
import LRU from 'lru-cache';

const cache = LRU({
  max: 1000,
  maxAge: 1000 * 60 * 10 // we keep it max 10mn
});

const {
  User,
  Activity
} = models;

const { Unauthorized } = errors;

export const updatePaypalEmail = (req, res, next) => {
  const required = req.required || {};

  req.user.paypalEmail = required.paypalEmail;

  req.user.save()
  .then((user) => res.send(user.info))
  .catch(next);
};

/*
 * End point for social media image lookup from the public donation page
 */
export const getSocialMediaAvatars = (req, res) => {
  const { userData } = req.body;
  userData.email = req.user.email;
  userData.ip = req.ip;

  userLib.resolveUserAvatars(userData, (err, results) => {
    res.send(results);
  });
};

  // TODO: reenable asynchronously
  // userLib.fetchInfo(user)
export const _create = (user) => User.createUserWithCollective(user)
  .tap(dbUser => Activity.create({
    type: constants.USER_CREATED,
    UserId: dbUser.id,
    data: {user: dbUser.info}
  }));


/**
 *
 * Public methods.
 *
 */

/**
 * Check existence of a user based on email
 */
export const exists = (req, res) => {
  const email = req.query.email;
  if (!isValidEmail(email)) {
    return res.send({ exists: false });
  }
  const exists = cache.get(email);
  if (exists !== undefined) {
    return res.send({ exists });
  } else {
   return models.User.findOne({ attributes: ['id'], where: { email }})
    .then(user => {
      cache.set(email, Boolean(user));
      return res.send({ exists: Boolean(user) });
    });
  }
}

/**
 * Create a user.
 */
export const create = (req, res, next) => {
  const { user } = req.required;

  _create(user)
    .tap(user => res.send(user.info))
    .catch(next);
};

/**
 * Get token.
 */
export const getToken = (req, res) => {
  res.send({
    access_token: req.user.jwt(),
    refresh_token: req.user.refresh_token
  });
};


/**
 * For the case when a user has submitted an expired token,
 * we can automatically detect the email address and send a refreshed token.
 */
export const refreshTokenByEmail = (req, res, next) => {
  if (!req.jwtPayload || !req.remoteUser) {
    return next(new Unauthorized('Invalid payload'));
  }

  let redirect;
  if (req.body.redirect) {
    ({ redirect } = req.body);
  } else {
    redirect = '/';
  }
  const user = req.remoteUser;

  return emailLib.send('user.new.token', req.remoteUser.email, {
    loginLink: user.generateLoginLink(redirect)},
    { bcc: 'ops@opencollective.com' }) // allows us to log in as users to debug issue)
  .then(() => res.send({ success: true }))
  .catch(next);
};

/**
 * Send an email with the new token #deprecated
 */
export const sendNewTokenByEmail = (req, res, next) => {
  const redirect = req.body.redirect || '/';
  return User.findOne({
    where: {
      email: req.required.email
    }
  })
  .then((user) => {
    // If you don't find a user, proceed without error
    // Otherwise, we can leak email addresses
    if (user) {
      return emailLib.send('user.new.token', req.body.email, 
        { loginLink: user.generateLoginLink(redirect)}, 
        { bcc: 'ops@opencollective.com'}); // allows us to log in as users to debug issue
    }
    return null;
  })
  .then(() => res.send({ success: true }))
  .catch(next);
};

/**
 * Login or create a new user
 */
export const signin = (req, res, next) => {
  const { user, redirect } = req.body;
  let loginLink;
  return models.User.findOne({ where: { email: user.email }})
    .then(u => u || models.User.createUserWithCollective(user))
    .then(u => {
      cache.set(u.email, true);
      loginLink = u.generateLoginLink(redirect || '/');
      return emailLib.send('user.new.token', u.email, 
        { loginLink }, 
        { bcc: 'ops@opencollective.com'}); // allows us to log in as users to debug issue
    })
    .then(() => {
      const response = { success: true };

      // For e2e testing, we enable testuser+(admin|member)@opencollective.com to automatically receive the login link
      if (process.env.NODE_ENV !== 'production' && user.email.match(/.*test.*@opencollective.com$/)) {
        response.redirect = loginLink;
      }
      return response;
    })
    .then(response => res.send(response))
    .catch(next);
}

/**
 * Deprecated (for old website)
 */


/**
 * Show.
 */
export const show = (req, res, next) => {

  const userData = req.user.show;

  if (req.remoteUser && req.remoteUser.id === req.user.id) {
    Promise.all([
      models.Collective.findById(req.user.CollectiveId),
      models.ConnectedAccount.findOne({ where: { service: 'stripe', CollectiveId: req.remoteUser.CollectiveId }})
    ])
      .then(results => {
        const userExtendedData = {
          username: results[0].slug,
          name: results[0].name,
          avatar: results[0].image,
          stripeAccount: results[1]
        };
        const response = Object.assign(userData, req.user.info, userExtendedData);
        res.send(response);
      })
      .catch(next);
  } else {
    res.send(userData);
  }
};