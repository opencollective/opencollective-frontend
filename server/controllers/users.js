import config from 'config';

import * as auth from '../lib/auth';
import emailLib from '../lib/email';
import models from '../models';
import logger from '../lib/logger';
import { isValidEmail } from '../lib/utils';

/**
 *
 * Public methods.
 *
 */

/**
 * Check existence of a user based on email
 */
export const exists = async (req, res) => {
  const email = req.query.email.toLowerCase();
  if (!isValidEmail(email)) {
    return res.send({ exists: false });
  } else {
    const user = await models.User.findOne({
      attributes: ['id'],
      where: { email },
    });
    return res.send({ exists: Boolean(user) });
  }
};

/**
 * Login or create a new user
 * If creating a user, we set the last login attempt to when user is created
 * If logging in, we get the last login from the db
 */
export const signin = (req, res, next) => {
  const { user, redirect, websiteUrl } = req.body;
  let loginLink;
  return models.User.findOne({ where: { email: user.email.toLowerCase() } })
    .then(u => u || models.User.createUserWithCollective(user))
    .then(u => {
      const now = new Date();
      const lastLoginAt = u.lastLoginAt || now;
      loginLink = u.generateLoginLink(redirect || '/', websiteUrl, lastLoginAt);
      if (config.env === 'development') {
        logger.info(`Login Link: ${loginLink}`);
      }
      return emailLib.send('user.new.token', u.email, { loginLink }, { sendEvenIfNotProduction: true });
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
};

/**
 * Receive a JWT and generate another one.
 *
 * This can be used right after the first login
 */
export const updateToken = async (req, res) => {
  const token = req.remoteUser.jwt({}, auth.TOKEN_EXPIRATION_SESSION);
  res.send({ token });
};
