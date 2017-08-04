import userLib from '../lib/userlib';
import constants from '../constants/activities';
import emailLib from '../lib/email';
import models from '../models';
import errors from '../lib/errors';

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
 * Send an email with the new token
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
        { bcc: 'ops@opencollective.com'}); // allows us to log in as users to debug issue)
    }
    return null;
  })
  .then(() => res.send({ success: true }))
  .catch(next);
};
