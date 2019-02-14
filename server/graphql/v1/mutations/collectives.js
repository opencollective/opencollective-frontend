import debug from 'debug';
import slugify from 'limax';
import { get, omit } from 'lodash';

import models from '../../../models';
import * as errors from '../../errors';
import emailLib from '../../../lib/email';
import * as github from '../../../lib/github';
import { defaultHostCollective } from '../../../lib/utils';

import roles from '../../../constants/roles';
import activities from '../../../constants/activities';
import { types } from '../../../constants/collectives';

const debugClaim = debug('claim');
const debugGithub = debug('github');

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

  if (args.collective.HostCollectiveId) {
    if (args.collective.HostCollectiveId === 858) {
      // opencollective.com/meetups
      // we assign them to a host based on their location
      // the host will have to approve them
      collectiveData.tags.push('Tech meetups');
      collectiveData.ParentCollectiveId = collectiveData.ParentCollectiveId || 858;
      if (collectiveData.timezone) {
        if (collectiveData.timezone.match(/Europe/)) {
          collectiveData.currency = 'EUR';
          args.collective.HostCollectiveId = 9807; // Open Collective Europe ASBL Host
        }
        if (collectiveData.timezone.match(/Paris/)) {
          collectiveData.currency = 'EUR';
          args.collective.HostCollectiveId = 11284; // Open Collective Paris Host
        }
        if (collectiveData.timezone.match(/Brussels/)) {
          collectiveData.currency = 'EUR';
          args.collective.HostCollectiveId = 9802; // BrusselsTogether ASBL Host
        }
        if (collectiveData.timezone.match(/London/)) {
          collectiveData.currency = 'GBP';
          args.collective.HostCollectiveId = 9806; // Open Collective UK Host
        }
        if (collectiveData.timezone.match(/^US/)) {
          collectiveData.currency = 'USD';
          args.collective.HostCollectiveId = 8674; // Open Collective Inc Host
        }
      } else {
        args.collective.HostCollectiveId = null;
      }
    }
  }

  collectiveData.isActive = false;
  if (args.collective.ParentCollectiveId) {
    parentCollective = await req.loaders.collective.findById.load(args.collective.ParentCollectiveId);
    if (!parentCollective) {
      return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
    }
    // The currency of the new created collective if not specified should be the one of its direct parent or the host (in this order)
    collectiveData.currency = collectiveData.currency || parentCollective.currency;
    collectiveData.HostCollectiveId = parentCollective.HostCollectiveId;
    if (req.remoteUser.hasRole([roles.ADMIN, roles.HOST, roles.MEMBER], parentCollective.id)) {
      collectiveData.isActive = true;
    }
  }

  if (collectiveData.HostCollectiveId) {
    hostCollective = await req.loaders.collective.findById.load(collectiveData.HostCollectiveId);
    if (!hostCollective) {
      return Promise.reject(new Error(`Host collective with id ${args.collective.HostCollectiveId} not found`));
    }
    collectiveData.currency = collectiveData.currency || hostCollective.currency;
    collectiveData.hostFeePercent = hostCollective.hostFeePercent;

    if (collectiveData.type === 'EVENT' || req.remoteUser.hasRole([roles.ADMIN, roles.HOST], hostCollective.id)) {
      collectiveData.isActive = true;
    } else if (!get(hostCollective, 'settings.apply')) {
      throw new errors.Unauthorized({
        message: 'This host does not accept applications for new collectives',
      });
    }
  }

  // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
  // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
  const slug = slugify(args.collective.slug || args.collective.name);
  if (collectiveData.ParentCollectiveId) {
    collectiveData.slug = `${slug}-${parentCollective.id}${collectiveData.type.substr(0, 2)}`.toLowerCase();
    const canCreateEvent = req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id);
    if (!canCreateEvent) {
      throw new errors.Unauthorized({
        message: `You must be logged in as a member of the ${parentCollective.slug} collective to create an event`,
      });
    }
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
        )} is already taken. Please use another name for your ${collectiveData.type.toLowerCase()}.`;
        break;
      default:
        msg = e.message;
        break;
    }
    throw new Error(msg);
  }

  const promises = [
    collective.editTiers(collectiveData.tiers),
    collective.addUserWithRole(req.remoteUser, roles.ADMIN, {
      CreatedByUserId: req.remoteUser.id,
    }),
    collective.editPaymentMethods(args.collective.paymentMethods, {
      CreatedByUserId: req.remoteUser.id,
    }),
  ];

  if (collectiveData.HostCollectiveId) {
    promises.push(collective.addHost(hostCollective, req.remoteUser));
  }

  await Promise.all(promises);

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
    collectiveData.ParentCollectiveId = defaultHostCollective('opensource').ParentCollectiveId;
    collectiveData.currency = 'USD';
    collectiveData.CreatedByUserId = user.id;
    collectiveData.LastEditedByUserId = user.id;
    collective = await models.Collective.create(collectiveData);
    const host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);
    const promises = [
      collective.addUserWithRole(user, roles.ADMIN),
      collective.addHost(host, user),
      collective.update({ isActive: true }),
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
      } is already taken. Please use another name for your ${collectiveData.type.toLowerCase()}.`,
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
    }
    collectiveData.tags = repo.topics;
    collectiveData.description = repo.description;
    collectiveData.settings = {
      githubRepo: repo.html_url,
    };
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

  collectiveData.ParentCollectiveId = defaultHostCollective('opensource').ParentCollectiveId;
  collectiveData.currency = 'USD';
  collectiveData.CreatedByUserId = user.id;
  collectiveData.LastEditedByUserId = user.id;
  collectiveData.teirs = [
    {
      name: 'backer',
      title: 'Backers',
      description: 'Support us with a monthly donation and help us continue our activities.',
      button: 'Become a backer',
      range: [2, 100000],
      presets: [2, 5, 10, 25, 50],
      interval: 'monthly',
    },
    {
      name: 'sponsor',
      title: 'Sponsors',
      description: 'Become a sponsor and get your logo on our README on Github with a link to your site.',
      button: 'Become a sponsor',
      range: [100, 500000],
      presets: [100, 250, 500],
      interval: 'monthly',
    },
  ];

  try {
    collective = await models.Collective.create(collectiveData);
  } catch (err) {
    throw new Error(err.message);
  }

  debugGithub('createdCollective', collective && collective.dataValues);
  const host = await models.Collective.findByPk(defaultHostCollective('opensource').CollectiveId);
  const promises = [
    collective.addUserWithRole(user, roles.ADMIN),
    collective.addHost(host, user),
    collective.update({ isActive: true }),
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
    type: activities.COLLECTIVE_CREATED,
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

  const location = args.collective.location || {};

  const newCollectiveData = {
    ...args.collective,
    locationName: location.name,
    address: location.address,
    LastEditedByUserId: req.remoteUser.id,
  };

  newCollectiveData.type = newCollectiveData.type || 'COLLECTIVE';

  if (location.lat) {
    newCollectiveData.geoLocationLatLong = {
      type: 'Point',
      coordinates: [location.lat, location.long],
    };
  }

  let collective, parentCollective;

  const promises = [
    req.loaders.collective.findById.load(args.collective.id).then(c => {
      if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
      collective = c;
    }),
  ];

  if (args.collective.ParentCollectiveId) {
    promises.push(
      req.loaders.collective.findById.load(args.collective.ParentCollectiveId).then(pc => {
        if (!pc)
          return Promise.reject(new Error(`Parent collective with id ${args.collective.ParentCollectiveId} not found`));
        parentCollective = pc;
      }),
    );
  }
  return Promise.all(promises)
    .then(() => {
      if (args.collective.slug && newCollectiveData.type === 'EVENT') {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
        const slug = slugify(args.collective.slug.replace(/(\-[0-9]+[a-z]{2})$/i, '') || args.collective.name);
        newCollectiveData.slug = `${slug}-${parentCollective.id}${collective.type.substr(0, 2)}`.toLowerCase();
      }
      if (newCollectiveData.type === 'EVENT') {
        return (
          req.remoteUser.id === collective.CreatedByUserId ||
          req.remoteUser.hasRole(['ADMIN', 'HOST', 'BACKER'], parentCollective.id)
        );
      } else {
        return (
          req.remoteUser.id === collective.CreatedByUserId ||
          req.remoteUser.hasRole(['ADMIN', 'HOST'], newCollectiveData.id)
        );
      }
    })
    .then(canEditCollective => {
      if (!canEditCollective) {
        let errorMsg;
        switch (newCollectiveData.type) {
          case types.EVENT:
            errorMsg = `You must be logged in as the creator of this Event or as an admin of the ${
              parentCollective.slug
            } collective to edit this Event Collective`;
            break;

          case types.USER:
            errorMsg = `You must be logged in as ${newCollectiveData.name} to edit this User Collective`;
            break;

          default:
            errorMsg = `You must be logged in as an admin or as the host of this ${newCollectiveData.type.toLowerCase()} collective to edit it`;
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
      }),
    )
    .then(() => {
      // TODO Deprecated since 2019-02-06 - We now use specific graphql queries
      if (args.collective.paymentMethods) {
        return collective.editPaymentMethods(args.collective.paymentMethods, {
          CreatedByUserId: req.remoteUser.id,
        });
      } else {
        return collective;
      }
    })
    .then(() => collective);
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

  return collective.update({ isActive: true });
}

export function deleteCollective(_, args, req) {
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
  Promise.all(emails);

  // return successful status, frontend should redirect to claimed collective page
  await collective.save();

  return collective;
}
