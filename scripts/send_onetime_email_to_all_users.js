#!/usr/bin/env node
import '../server/env';

/*
 * This script is useful for sending a one-time email to all users.
 */

console.log('This script is being deprecated.');
console.log('To re-enable it, remove this message with a Pull Request explaining the use case.');
process.exit();

/*
process.env.PORT = 3066;

import Promise from 'bluebird';
import debugLib from 'debug';
import models, { Op } from '../server/models';
import emailLib from '../server/lib/email';

const debug = debugLib('onetime.email');

const { User } = models;

const init = () => {
  console.log('\nStarting script to send a one-time email...\n');

  const startTime = new Date();

  // find all users
  const usersQuery = {
    attributes: ['email', 'firstName', 'lastName'],
    include: [{ model: models.Transaction, required: true }],
  };

  // for debugging, handpick a few users
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    usersQuery.where = {
      username: { [Op.in]: ['xdamman', 'piamancini', 'aseem'] },
    };

  return User.findAll(usersQuery)
    .then(sendEmail)
    .then(() => {
      const timeLapsed = Math.round((new Date() - startTime) / 1000);
      console.log(`Total run time: ${timeLapsed}s`);
      process.exit(0);
    });
};

const sendEmail = recipients => {
  const data = {};
  if (recipients.length === 0) return;
  return Promise.map(recipients, recipient => {
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug('Skipping ', recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('announcement', recipient.email, data, { bcc: ' ' });
  });
};

init();

*/
