#!/usr/bin/env node

/*
 * This script is useful for sending a one-time email to all group MEMBERS (aka core contributors).
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
  Group,
  UserGroup,
  User
} = models;

const init = () => {
  console.log("\nStarting script to send a one-time email...\n");

  const startTime = new Date;

  // find all active groups
  const groupQuery = {
    attributes: ['id', 'slug'],
    include: [ { model: models.Transaction, required: true }]
  }

  // for debugging, handpick a few groups
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    groupQuery.where = { slug: {$in: ['webpack']} };

  // get all active groups
  return Group.findAll(groupQuery)
  .tap(groups => console.log(`Active groups found: ${groups.length}`))
  .map(group => group.id)
  .then(groupIds => sequelize.query(`
    SELECT u.email, u."firstName", u."lastName" from "UserGroups" ug
    LEFT JOIN "Users" u on ug."UserId" = u.id
    where ug.role = :role and ug."GroupId" IN (:groupIds)
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { groupIds, role: roles.MEMBER }
    }))
  .tap(coreContributorsOfActiveGroups => console.log(`Core contributors found: ${JSON.stringify(coreContributorsOfActiveGroups)}`))
  .then(coreContributorsOfActiveGroups => sendEmail(coreContributorsOfActiveGroups, {}))
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0);
  });
}

const sendEmail = (recipients, data) => {
  if (recipients.length === 0) return;
  return Promise.map(recipients, recipient => {
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('onetime', recipient.email, data);
  });
}

init();
