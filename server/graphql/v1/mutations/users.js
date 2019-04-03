import crypto from 'crypto';
import models from '../../../models';
import { Unauthorized, ValidationFailed, InvalidToken } from '../../errors';
import emailLib from '../../../lib/email';

/**
 * Sets `emailWaitingForValidation` to `newEmail` for `user` and sends a confirmation
 * email for users to confirm their email addresses.
 */
export const updateUserEmail = async (user, newEmail) => {
  if (!user) {
    throw new Unauthorized();
  }

  // Put some rate limiting for user so they can't bruteforce the system to guess emails
  // TODO

  // If somehow user tries to update the email to its existing value then we remove
  // any email waiting for confirmation
  if (user.email === newEmail) {
    if (user.emailWaitingForValidation !== null) {
      return user.update({ emailWaitingForValidation: null, emailConfirmationToken: null });
    }
    return user;
  }

  // Ensure this email is not already used by another user
  const existingEmail = await models.User.findOne({ where: { email: newEmail } });
  if (existingEmail) {
    throw new ValidationFailed({ message: 'A user with that email already exists' });
  }

  // If user tries to update again with the same email, we send the email without
  // re-generating the token.
  if (newEmail !== user.emailWaitingForValidation) {
    // Store temporary user's email and generate the confirmation token
    user = await user.update({
      emailWaitingForValidation: newEmail,
      emailConfirmationToken: crypto.randomBytes(48).toString('hex'),
    });
  }

  // Send the email and return updated user
  await emailLib.send('user.changeEmail', user.emailWaitingForValidation, { user });

  return user;
};

/**
 * From a given token (generated in `updateUserEmail`) confirm the new email
 * and updates the user record.
 */
export const confirmUserEmail = async emailConfirmationToken => {
  if (!emailConfirmationToken) {
    throw new ValidationFailed({ message: 'Email confirmation token must be set' });
  }

  // Put some rate limiting here too so malicious users don't try to bruteforce the token
  // TODO

  const user = await models.User.findOne({ where: { emailConfirmationToken } });

  if (!user) {
    throw new InvalidToken({ internalData: { emailConfirmationToken } });
  }

  return user.update({
    email: user.emailWaitingForValidation,
    emailWaitingForValidation: null,
    emailConfirmationToken: null,
  });
};
