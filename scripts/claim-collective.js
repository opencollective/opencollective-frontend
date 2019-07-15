import '../server/env';

import debug from 'debug';

import models from '../server/models';
import roles from '../server/constants/roles';
import emailLib from '../server/lib/email';
import { defaultHostCollective } from '../server/lib/utils';

const debugClaim = debug('claim');

const claimCollective = async (collectiveId, userId) => {
  let collective = await models.Collective.findByPk(collectiveId);
  if (!collective) {
    throw new Error(`Collective with id ${collectiveId} not found`);
  }

  let host = await collective.getHostCollective();
  if (host) {
    throw new Error('This collective already has a host');
  }

  const admins = await collective.getAdmins();
  if (admins.length > 0) {
    throw new Error('This collective has already been claimed');
  }

  const user = await models.User.findByPk(userId);
  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  // add remoteUser as admin of collective
  await collective.addUserWithRole(user, roles.ADMIN);

  collective = await collective.update({
    CreatedByUserId: user.id,
    LastEditedByUserId: user.id,
  });

  // add opensource collective as host
  // set collective as active
  // create default tiers
  host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);

  collective = await collective.addHost(host, {
    ...user.minimal,
    isAdmin: () => true,
  });

  // get pledges
  const pledges = await models.Order.findAll({
    include: [{ all: true }],
    where: {
      CollectiveId: collective.id,
      status: 'PENDING',
    },
  });

  debugClaim(`${pledges.length} pledges found for collective ${collective.name}`);

  // send complete-pledge emails to pledges
  const emails = pledges.map(pledge => {
    const { collective, createdByUser, fromCollective, Subscription } = pledge;
    return emailLib.send('pledge.complete', createdByUser.email, {
      collective: collective.info,
      fromCollective: fromCollective.minimal,
      interval: Subscription && Subscription.interval,
      order: pledge.info,
    });
  });

  await Promise.all(emails);

  // return successful status, frontend should redirect to claimed collective page
  await collective.save();

  return collective;
};

const collectiveId = process.argv[2];
if (!collectiveId) {
  throw new Error('Missing collectiveId');
}

const userId = process.argv[3];
if (!userId) {
  throw new Error('Missing userId');
}

claimCollective(collectiveId, userId);
