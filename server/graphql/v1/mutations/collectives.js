import debug from 'debug';
import slugify from 'limax';
import { get, omit, truncate } from 'lodash';
import { map } from 'bluebird';
import config from 'config';

import models, { Op } from '../../../models';
import * as errors from '../../errors';
import emailLib from '../../../lib/email';
import * as github from '../../../lib/github';
import { defaultHostCollective } from '../../../lib/utils';

import roles from '../../../constants/roles';
import activities from '../../../constants/activities';
import { types } from '../../../constants/collectives';
import { purgeCacheForPage } from '../../../lib/cloudflare';

const debugClaim = debug('claim');
const debugGithub = debug('github');
const debugDelete = debug('delete');

export async function createCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to create a collective',
    });
  }

  if (!args.collective.name) {
    throw new errors.ValidationFailed({ message: 'collective.name required' });
  }

  let hostCollective, parentCollective, collective;

  const collectiveData = {
    ...args.collective,
    CreatedByUserId: req.remoteUser.id,
  };

  const location = args.collective.location;
  if (location) {
    collectiveData.locationName = location.name;
    collectiveData.address = location.address;
    if (location.lat) {
      collectiveData.geoLocationLatLong = {
        type: 'Point',
        coordinates: [location.lat, location.long],
      };
    }
  }

  collectiveData.isActive = false;
  if (args.collective.ParentCollectiveId) {
    parentCollective = await req.loaders.collective.findById.load(args.collective.ParentCollectiveId);
    if (!parentCollective) {
      return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
    } else if (!req.remoteUser.hasRole([roles.ADMIN, roles.HOST, roles.MEMBER], parentCollective.id)) {
      throw new errors.Unauthorized({
        message: `You must be logged in as a member of the ${parentCollective.slug} collective to create an event`,
      });
    }

    // The currency of the new created collective if not specified should be the one of its direct parent or the host (in this order)
    collectiveData.currency = collectiveData.currency || parentCollective.currency;
    collectiveData.HostCollectiveId = parentCollective.HostCollectiveId;
  }

  if (collectiveData.HostCollectiveId) {
    hostCollective = await req.loaders.collective.findById.load(collectiveData.HostCollectiveId);
    if (!hostCollective) {
      return Promise.reject(new Error(`Host collective with id ${args.collective.HostCollectiveId} not found`));
    } else if (req.remoteUser.hasRole([roles.ADMIN], hostCollective.id)) {
      collectiveData.isActive = true;
    } else if (parentCollective && parentCollective.HostCollectiveId === hostCollective.id) {
      // We can approve the collective directly if same host and parent collective is already approved
      collectiveData.isActive = parentCollective.isActive;
      collectiveData.approvedAt = parentCollective.isActive ? new Date() : null;
    } else if (!get(hostCollective, 'settings.apply')) {
      throw new errors.Unauthorized({
        message: 'This host does not accept applications for new collectives',
      });
    }

    collectiveData.currency = collectiveData.currency || hostCollective.currency;
    collectiveData.hostFeePercent = hostCollective.hostFeePercent;
  }

  // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
  // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
  const slug = slugify(args.collective.slug || args.collective.name);
  if (collectiveData.ParentCollectiveId) {
    collectiveData.slug = `${slug}-${parentCollective.id}${collectiveData.type.substr(0, 2)}`.toLowerCase();
  }

  try {
    collective = await models.Collective.create(omit(collectiveData, ['HostCollectiveId', 'hostFeePercent']));
  } catch (e) {
    let msg;
    switch (e.name) {
      case 'SequelizeUniqueConstraintError':
        msg = `The slug ${e.fields.slug.replace(
          /\-[0-9]+ev$/,
          '',
        )} is already taken. Please use another slug for your ${collectiveData.type.toLowerCase()}.`;
        break;
      default:
        msg = e.message;
        break;
    }
    throw new Error(msg);
  }

  const promises = [
    collective.addUserWithRole(req.remoteUser, roles.ADMIN, {
      CreatedByUserId: req.remoteUser.id,
    }),
  ];

  if (collectiveData.tiers) {
    promises.push(collective.editTiers(collectiveData.tiers));
  }

  if (collectiveData.HostCollectiveId) {
    promises.push(collective.addHost(hostCollective, req.remoteUser));
  }

  // We add the admins of the parent collective as admins
  if (collectiveData.type === types.EVENT) {
    const admins = await models.Member.findAll({ where: { CollectiveId: parentCollective.id, role: roles.ADMIN } });
    admins.forEach(member => {
      if (member.MemberCollectiveId !== req.remoteUser.CollectiveId) {
        promises.push(
          models.Member.create({
            CreatedByUserId: req.remoteUser.id,
            CollectiveId: collective.id,
            MemberCollectiveId: member.MemberCollectiveId,
            role: roles.ADMIN,
          }),
        );
      }
    });
  }

  await Promise.all(promises);

  // Purge cache for parent collective (for events) and hosts
  if (parentCollective) {
    purgeCacheForPage(`/${parentCollective.slug}`);
  }
  if (hostCollective) {
    purgeCacheForPage(`/${hostCollective.slug}`);
  }

  // if the type of collective is an organization or an event, we don't notify the host
  if (collective.type !== types.COLLECTIVE) {
    return collective;
  }
  const remoteUserCollective = await models.Collective.findByPk(req.remoteUser.CollectiveId);
  models.Activity.create({
    type: activities.COLLECTIVE_CREATED,
    UserId: req.remoteUser.id,
    CollectiveId: get(hostCollective, 'id'),
    data: {
      collective: collective.info,
      host: get(hostCollective, 'info'),
      user: {
        email: req.remoteUser.email,
        collective: remoteUserCollective.info,
      },
    },
  });

  return collective;
}

export async function createCollectiveFromGithub(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to create a collective',
    });
  }

  if (!args.collective.name) {
    throw new errors.ValidationFailed({ message: 'collective.name required' });
  }

  let collective;
  const collectiveData = { ...args.collective };
  const user = req.remoteUser;
  const githubHandle = collectiveData.githubHandle;

  // For e2e testing, we enable testuser+(admin|member)@opencollective.com to create collective without github validation
  if (process.env.NODE_ENV !== 'production' && user.email.match(/.*test.*@opencollective.com$/)) {
    const existingCollective = models.Collective.findOne({
      where: { slug: collectiveData.slug.toLowerCase() },
    });
    if (existingCollective) {
      collectiveData.slug = `${collectiveData.slug}-${Math.floor(Math.random() * 1000 + 1)}`;
    }
    collectiveData.currency = 'USD';
    collectiveData.CreatedByUserId = user.id;
    collectiveData.LastEditedByUserId = user.id;
    collective = await models.Collective.create(collectiveData);
    const host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);
    const promises = [
      collective.addUserWithRole(user, roles.ADMIN),
      collective.addHost(host, user),
      collective.update({ isActive: true, approvedAt: new Date() }),
    ];

    await Promise.all(promises);
    return collective;
  }

  const existingCollective = await models.Collective.findOne({
    where: { slug: collectiveData.slug.toLowerCase() },
  });

  if (existingCollective) {
    throw new Error(
      `The slug ${
        collectiveData.slug
      } is already taken. Please use another slug for your ${collectiveData.type.toLowerCase()}.`,
    );
  }

  const githubAccount = await models.ConnectedAccount.findOne({
    where: { CollectiveId: req.remoteUser.CollectiveId, service: 'github' },
  });

  if (!githubAccount) {
    throw new errors.Unauthorized({
      message: 'You must have a connected GitHub Account to claim a collective',
    });
  }

  if (githubHandle.includes('/')) {
    // A repository GitHub Handle (most common)
    const repo = await github.getRepo(githubHandle, githubAccount.token);

    const isGithubRepositoryAdmin = get(repo, 'permissions.admin') === true;
    if (!isGithubRepositoryAdmin) {
      throw new errors.ValidationFailed({
        message: "We could not verify that you're admin of the GitHub repository",
      });
    } else if (repo.stargazers_count < config.githubFlow.minNbStars) {
      throw new errors.ValidationFailed({
        message: `The repository need at least ${config.githubFlow.minNbStars} stars to apply to the Open Source Collective.`,
      });
    }

    collectiveData.tags = repo.topics || [];
    collectiveData.tags.push('open source');
    collectiveData.description = truncate(repo.description, { length: 255 });
    collectiveData.longDescription = repo.description;
    collectiveData.settings = { githubRepo: githubHandle };
  } else {
    // An organization GitHub Handle
    const memberships = await github.getOrgMemberships(githubAccount.token);
    const organizationAdminMembership =
      memberships &&
      memberships.find(m => m.organization.login === githubHandle && m.state === 'active' && m.role === 'admin');
    if (!organizationAdminMembership) {
      throw new errors.ValidationFailed({
        message: "We could not verify that you're admin of the GitHub organization",
      });
    }
    const allRepos = await github.getAllOrganizationPublicRepos(githubHandle).catch(() => null);
    const repoWith100stars = allRepos.find(repo => repo.stargazers_count >= config.githubFlow.minNbStars);
    if (!repoWith100stars) {
      throw new errors.ValidationFailed({
        message: `The organization need at least one repository with ${config.githubFlow.minNbStars} GitHub stars to be pledged.`,
      });
    }
    collectiveData.settings = { githubOrg: githubHandle };
    // TODO: we sometime still wants to store the main repository
  }

  collectiveData.currency = 'USD';
  collectiveData.CreatedByUserId = user.id;
  collectiveData.LastEditedByUserId = user.id;

  try {
    collective = await models.Collective.create(collectiveData);
  } catch (err) {
    throw new Error(err.message);
  }

  debugGithub('createdCollective', collective && collective.dataValues);
  const host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);
  const promises = [
    collective.addUserWithRole(user, roles.ADMIN),
    collective.addHost(host, user, { skipCollectiveApplyActivity: true }),
    collective.update({ isActive: true, approvedAt: new Date() }),
  ];

  await Promise.all(promises);

  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    collective: collective.info,
  };
  debugGithub('sending github.signup to', user.email, 'with data', data);
  await emailLib.send('github.signup', user.email, data);
  models.Activity.create({
    type: activities.COLLECTIVE_CREATED_GITHUB,
    UserId: user.id,
    CollectiveId: collective.id,
    data: {
      collective: collective.info,
      host: host.info,
      user: user.info,
    },
  });

  return collective;
}

export function editCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to edit a collective',
    });
  }

  if (!args.collective.id) {
    return Promise.reject(new errors.ValidationFailed({ message: 'collective.id required' }));
  }

  const newCollectiveData = {
    ...omit(args.collective, ['location', 'type', 'ParentCollectiveId']),
    LastEditedByUserId: req.remoteUser.id,
  };

  // Set location values
  const location = args.collective.location || {};
  if (location.lat) {
    newCollectiveData.geoLocationLatLong = {
      type: 'Point',
      coordinates: [location.lat, location.long],
    };
  }
  if (location.name !== undefined) {
    newCollectiveData.locationName = location.name;
  }
  if (location.address !== undefined) {
    newCollectiveData.address = location.address;
  }
  if (location.country !== undefined) {
    newCollectiveData.countryISO = location.country;
  }

  let collective, parentCollective;

  return req.loaders.collective.findById
    .load(args.collective.id)
    .then(c => {
      if (!c) {
        throw new Error(`Collective with id ${args.collective.id} not found`);
      }
      collective = c;
    })
    .then(() => {
      if (collective.ParentCollectiveId) {
        return req.loaders.collective.findById.load(collective.ParentCollectiveId).then(pc => {
          if (!pc) {
            return Promise.reject(new Error(`Parent collective with id ${collective.ParentCollectiveId} not found`));
          }
          parentCollective = pc;
        });
      }
    })
    .then(() => {
      if (args.collective.slug && collective.type === 'EVENT') {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
        const slug = slugify(args.collective.slug.replace(/(\-[0-9]+[a-z]{2})$/i, '') || args.collective.name);
        newCollectiveData.slug = `${slug}-${parentCollective.id}${collective.type.substr(0, 2)}`.toLowerCase();
      }
      if (collective.type === 'EVENT') {
        return req.remoteUser.isAdmin(collective.id) || req.remoteUser.isAdmin(parentCollective.id);
      } else {
        return req.remoteUser.isAdmin(collective.id);
      }
    })
    .then(canEditCollective => {
      if (!canEditCollective) {
        let errorMsg;
        switch (collective.type) {
          case types.EVENT:
            errorMsg = `You must be logged in as the creator of this Event or as an admin of the ${parentCollective.slug} collective to edit this Event Collective`;
            break;

          case types.USER:
            errorMsg = `You must be logged in as ${newCollectiveData.name} to edit this User Collective`;
            break;

          default:
            errorMsg = `You must be logged in as an admin or as the host of this ${collective.type.toLowerCase()} collective to edit it`;
        }
        return Promise.reject(new errors.Unauthorized({ message: errorMsg }));
      }
    })
    .then(() => {
      // If we try to change the host
      if (
        newCollectiveData.HostCollectiveId !== undefined &&
        newCollectiveData.HostCollectiveId !== collective.HostCollectiveId
      ) {
        return collective.changeHost(newCollectiveData.HostCollectiveId, req.remoteUser);
      }
    })
    .then(() => {
      // If we try to change the `hostFeePercent`
      if (
        newCollectiveData.hostFeePercent !== undefined &&
        newCollectiveData.hostFeePercent !== collective.hostFeePercent
      ) {
        return collective.updateHostFee(newCollectiveData.hostFeePercent, req.remoteUser);
      }
    })
    .then(() => collective.update(omit(newCollectiveData, ['HostCollectiveId', 'hostFeePercent']))) // we omit those attributes that have already been updated above
    .then(() => collective.editTiers(args.collective.tiers))
    .then(() =>
      collective.editMembers(args.collective.members, {
        CreatedByUserId: req.remoteUser.id,
        remoteUserCollectiveId: req.remoteUser.CollectiveId,
      }),
    )
    .then(() => {
      // Ask cloudflare to refresh the cache for this collective's page
      purgeCacheForPage(`/${collective.slug}`);
      return collective;
    });
}

export async function approveCollective(remoteUser, CollectiveId) {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to approve a collective',
    });
  }

  const collective = await models.Collective.findByPk(CollectiveId);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${CollectiveId} not found`,
    });
  }

  const hostCollective = await collective.getHostCollective();
  if (!hostCollective) {
    throw new errors.ValidationFailed({
      message: 'We could not get the Host data for the Collective. Maybe they cancel their application.',
    });
  }

  if (!remoteUser.isAdmin(hostCollective.id)) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in as an admin of the host of this collective to approve it',
      data: { HostCollectiveId: hostCollective.id },
    });
  }

  models.Activity.create({
    type: activities.COLLECTIVE_APPROVED,
    UserId: remoteUser.id,
    CollectiveId: hostCollective.id,
    data: {
      collective: collective.info,
      host: hostCollective.info,
      user: {
        email: remoteUser.email,
      },
    },
  });

  // Approve all events created by this collective under this host
  models.Collective.findAll({
    where: {
      type: types.EVENT,
      HostCollectiveId: hostCollective.id,
      ParentCollectiveId: collective.id,
      isActive: false,
    },
  }).then(events => {
    events.map(event => {
      event.update({ isActive: true, approvedAt: new Date() });
    });
  });

  // Approve the collective and return it
  return collective.update({ isActive: true, approvedAt: new Date() });
}

export function deleteEventCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to delete a collective',
    });
  }

  return models.Collective.findByPk(args.id).then(collective => {
    if (!collective)
      throw new errors.NotFound({
        message: `Collective with id ${args.id} not found`,
      });
    if (!req.remoteUser.isAdmin(collective.id) && !req.remoteUser.isAdmin(collective.ParentCollectiveId)) {
      throw new errors.Unauthorized({
        message: 'You need to be logged in as a core contributor or as a host to delete this collective',
      });
    }

    return collective.destroy();
  });
}

export async function claimCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to claim a collective',
    });
  }

  let collective = await models.Collective.findByPk(args.id);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${args.id} not found`,
    });
  }

  const admins = await collective.getAdmins();
  if (admins.length > 0) {
    throw new errors.ValidationFailed({
      message: 'This collective has already been claimed',
    });
  }

  let githubHandle = collective.githubHandle;
  if (!githubHandle && collective.website && collective.website.includes('://github.com/')) {
    githubHandle = collective.website.split('://github.com/')[1];
  }
  if (!githubHandle) {
    throw new errors.Unauthorized({
      message: "We can't find the GitHub handle for the collective to be claimed",
    });
  }

  const githubAccount = await models.ConnectedAccount.findOne({
    where: { CollectiveId: req.remoteUser.CollectiveId, service: 'github' },
  });
  if (!githubAccount) {
    throw new errors.Unauthorized({
      message: 'You must have a connected GitHub Account to claim a collective',
    });
  }

  if (githubHandle.includes('/')) {
    // A repository GitHub Handle (most common)
    const repo = await github.getRepo(githubHandle, githubAccount.token);
    const isGithubRepositoryAdmin = get(repo, 'permissions.admin') === true;
    if (!isGithubRepositoryAdmin) {
      throw new errors.ValidationFailed({
        message: "We could not verify that you're admin of the GitHub repository",
      });
    }
  } else {
    // An organization GitHub Handle
    const memberships = await github.getOrgMemberships(githubAccount.token);
    const organizationAdminMembership =
      memberships &&
      memberships.find(m => m.organization.login === githubHandle && m.state === 'active' && m.role === 'admin');
    if (!organizationAdminMembership) {
      throw new errors.ValidationFailed({
        message: "We could not verify that you're admin of the GitHub organization",
      });
    }
  }

  // add remoteUser as admin of collective
  await collective.addUserWithRole(req.remoteUser, roles.ADMIN);
  collective = await collective.update({
    CreatedByUserId: req.remoteUser.id,
    LastEditedByUserId: req.remoteUser.id,
  });

  // add opensource collective as host
  // set collective as active
  // create default tiers
  const host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);

  collective = await collective.addHost(host, {
    ...req.remoteUser.minimal,
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
}

export async function archiveCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to archive a collective',
    });
  }

  const collective = await models.Collective.findByPk(args.id);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${args.id} not found`,
    });
  }

  if (!req.remoteUser.isAdmin(collective.id)) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in as an Admin.',
    });
  }

  const balance = await collective.getBalance();

  if (balance > 0) {
    throw new Error('Cannot archive collective with balance > 0');
  }

  const membership = await models.Member.findOne({
    where: {
      CollectiveId: collective.id,
      MemberCollectiveId: collective.HostCollectiveId,
      role: roles.HOST,
    },
  });

  if (membership) {
    membership.destroy();
  }

  return collective.update({ isActive: false, deactivatedAt: Date.now(), approvedAt: null, HostCollectiveId: null });
}

export async function unarchiveCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to unarchive a collective',
    });
  }

  const collective = await models.Collective.findByPk(args.id);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${args.id} not found`,
    });
  }

  if (!req.remoteUser.isAdmin(collective.id)) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in as an Admin.',
    });
  }

  return collective.update({ deactivatedAt: null });
}

export async function deleteCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to delete a collective',
    });
  }

  const collective = await models.Collective.findByPk(args.id);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${args.id} not found`,
    });
  }

  if (!req.remoteUser.isAdmin(collective.id)) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in as an Admin.',
    });
  }

  const transactionCount = await models.Transaction.count({
    where: {
      [Op.or]: [{ CollectiveId: collective.id }, { FromCollectiveId: collective.id }],
    },
  });
  const orderCount = await models.Order.count({
    where: {
      [Op.or]: [{ CollectiveId: collective.id }, { FromCollectiveId: collective.id }],
    },
  });

  if (transactionCount > 0 || orderCount > 0) {
    throw new Error('Can not delete collective with existing orders.');
  }

  const expenseCount = await models.Expense.count({
    where: { CollectiveId: collective.id, status: 'PAID' },
  });

  if (expenseCount > 0) {
    throw new Error('Can not delete collective with paid expenses.');
  }

  return models.Member.findAll({
    where: { CollectiveId: collective.id },
  })
    .then(members => {
      return map(
        members,
        member => {
          return member.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteCollectiveMembers'))
    .then(async () => {
      const expenses = await models.Expense.findAll({
        where: { CollectiveId: collective.id },
      });
      return map(
        expenses,
        expense => {
          return expense.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteCollectiveExpenses'))
    .then(async () => {
      const tiers = await models.Tier.findAll({
        where: { CollectiveId: collective.id },
      });
      return map(
        tiers,
        tier => {
          return tier.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteCollectiveTiers'))
    .then(async () => {
      const paymentMethods = await models.PaymentMethod.findAll({
        where: { CollectiveId: collective.id },
      });
      return map(
        paymentMethods,
        paymentMethod => {
          return paymentMethod.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteCollectivePaymentMethods'))
    .then(async () => {
      const connectedAccounts = await models.ConnectedAccount.findAll({
        where: { CollectiveId: collective.id },
      });
      return map(
        connectedAccounts,
        connectedAccount => {
          return connectedAccount.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteCollectiveConnectedAccounts'))
    .then(() => {
      // Update collective slug to free the current slug for future
      const newSlug = `${collective.slug}-${Date.now()}`;
      return collective.update({ slug: newSlug });
    })
    .then(() => collective.destroy())
    .then(() => collective);
}

export async function deleteUserCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to delete your account',
    });
  }
  const user = await models.User.findOne({ where: { id: req.remoteUser.id } });
  const userCollective = await models.Collective.findOne({
    where: { id: args.id },
  });
  const transactionCount = await models.Transaction.count({
    where: { FromCollectiveId: userCollective.id },
  });
  const orderCount = await models.Order.count({
    where: { FromCollectiveId: userCollective.id },
  });

  if (transactionCount > 0 || orderCount > 0) {
    throw new Error('Can not delete user with existing orders.');
  }

  const expenseCount = await models.Expense.count({
    where: { UserId: user.id, status: 'PAID' },
  });

  if (expenseCount > 0) {
    throw new Error('Can not delete user with paid expenses.');
  }

  const members = await models.Member.findAll({
    where: { MemberCollectiveId: userCollective.id },
    include: [{ model: models.Collective, as: 'collective' }],
  });

  const adminMembership = members.filter(m => m.role === roles.ADMIN);
  if (adminMembership.length >= 1) {
    for (const member of adminMembership) {
      const admins = await member.collective.getAdmins();
      if (admins.length === 1) {
        throw new Error(
          `Your account cannot be deleted, you're the only admin of ${member.collective.name}, please delete the collective or add a new admin.`,
        );
      }
    }
  }

  return map(
    members,
    member => {
      return member.destroy();
    },
    { concurrency: 3 },
  )
    .then(() => debugDelete('deleteUserMemberships'))
    .then(async () => {
      const expenses = await models.Expense.findAll({ where: { UserId: user.id } });
      return map(
        expenses,
        expense => {
          return expense.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteUserExpenses'))
    .then(async () => {
      const paymentMethods = await models.PaymentMethod.findAll({
        where: { CollectiveId: userCollective.id },
      });
      return map(
        paymentMethods,
        paymentMethod => {
          return paymentMethod.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteUserPaymentMethods'))
    .then(async () => {
      const connectedAccounts = await models.ConnectedAccount.findAll({
        where: { CollectiveId: userCollective.id },
      });
      return map(
        connectedAccounts,
        connectedAccount => {
          return connectedAccount.destroy();
        },
        { concurrency: 3 },
      );
    })
    .then(() => debugDelete('deleteUserConnectedAccounts'))
    .then(() => {
      // Update collective slug to free the current slug for future
      const newSlug = `${userCollective.slug}-${Date.now()}`;
      return userCollective.update({ slug: newSlug });
    })
    .then(() => {
      return userCollective.destroy();
    })
    .then(() => debugDelete('deleteUserCollective'))
    .then(() => {
      // Update user email in order to free up for future reuse
      // Split the email, username from host domain
      const splitedEmail = user.email.split('@');
      // Add the current timestamp to email username
      const newEmail = `${splitedEmail[0]}-${Date.now()}@${splitedEmail[1]}`;
      return user.update({ email: newEmail });
    })
    .then(() => {
      return user.destroy();
    })
    .then(() => userCollective);
}
