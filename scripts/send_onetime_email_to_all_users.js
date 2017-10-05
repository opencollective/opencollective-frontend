#!/usr/bin/env node

/*
 * This script is useful for sending a one-time email to all users.
 */ 

process.env.PORT = 3066;

import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import models, { sequelize } from '../server/models';
import emailLib from '../server/lib/email';
import roles from '../server/constants/roles';

const debug = debugLib('onetime.email');

const {
  Collective,
  Member,
  User
} = models;

const init = () => {
  console.log("\nStarting script to send a one-time email...\n");

  const startTime = new Date;

  // find all users
  const usersQuery = {
    attributes: ['email', 'firstName', 'lastName'],
    include: [ { model: models.Transaction, required: true }]
  }

  // for debugging, handpick a few users
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    usersQuery.where = { username: {$in: ['xdamman','piamancini','aseem']} };

  return User.findAll(usersQuery)
  .then(sendEmail)
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0);
  });
}

const sendEmail = (recipients) => {
  const data = {};
  if (recipients.length === 0) return;
  return Promise.map(recipients, recipient => {
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('announcement', recipient.email, data, { bcc: ' ' });
  });
}

init();
