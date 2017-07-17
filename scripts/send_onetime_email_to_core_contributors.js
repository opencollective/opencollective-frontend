#!/usr/bin/env node

/*
 * This script is useful for sending a one-time email to all collective MEMBERS (aka core contributors).
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
  Role,
  User
} = models;

const init = () => {
  console.log("\nStarting script to send a one-time email...\n");

  const startTime = new Date;

  // find all active collectives
  const collectiveQuery = {
    attributes: ['id', 'slug'],
    include: [ { model: models.Transaction, required: true }]
  }

  // for debugging, handpick a few collectives
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    collectiveQuery.where = { slug: {$in: ['webpack']} };

  // get all active collectives
  return Collective.findAll(collectiveQuery)
  .tap(collectives => console.log(`Active collectives found: ${collectives.length}`))
  .map(collective => collective.id)
  .then(collectiveIds => sequelize.query(`
    SELECT distinct(u.email), u."firstName", u."lastName" from "Roles" ug
    LEFT JOIN "Users" u on ug."UserId" = u.id
    where ug.role = :role and ug."CollectiveId" IN (:collectiveIds)
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { collectiveIds, role: roles.MEMBER }
    }))
  .tap(coreContributorsOfActiveCollectives => console.log(`Core contributors found: ${coreContributorsOfActiveCollectives.length}`))
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
    return emailLib.send('announcement', recipient.email, data);
  });
}

init();
