import slugify from 'slug';
import { get, omit } from 'lodash';
import models from '../../models';
import * as errors from '../errors';
import { types } from '../../constants/collectives';
import roles from '../../constants/roles';
import activities from '../../constants/activities';

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
      }
      collectiveData.tags.push('Tech meetups');
    }
  }

  collectiveData.isActive = false;
  if (args.collective.ParentCollectiveId) {
    parentCollective = await req.loaders.collective.findById.load(
      args.collective.ParentCollectiveId,
    );
    if (!parentCollective) {
      return Promise.reject(
        new Error(
          `Parent collective with id ${
            args.collective.ParentCollectiveId
          } not found`,
        ),
      );
    }
    // The currency of the new created collective if not specified should be the one of its direct parent or the host (in this order)
    collectiveData.currency = collectiveData.currency || parentCollective.currency;
    collectiveData.HostCollectiveId = parentCollective.HostCollectiveId;
    if (req.remoteUser.hasRole([roles.ADMIN, roles.HOST, roles.MEMBER], parentCollective.id)) {
      collectiveData.isActive = true;
    }
  }

  if (collectiveData.HostCollectiveId) {
    hostCollective = await req.loaders.collective.findById.load(
      collectiveData.HostCollectiveId,
    );
    if (!hostCollective) {
      return Promise.reject(
        new Error(
          `Host collective with id ${
            args.collective.HostCollectiveId
          } not found`,
        ),
      );
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
    collectiveData.slug = `${slug}-${
      parentCollective.id
    }${collectiveData.type.substr(0, 2)}`.toLowerCase();
    const canCreateEvent = req.remoteUser.hasRole(
      ['ADMIN', 'HOST', 'BACKER'],
      parentCollective.id,
    );
    if (!canCreateEvent) {
      throw new errors.Unauthorized({
        message: `You must be logged in as a member of the ${
          parentCollective.slug
        } collective to create an event`,
      });
    }
  }

  try {
    collective = await models.Collective.create(
      omit(collectiveData, 'HostCollectiveId'),
    );
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
  const remoteUserCollective = await models.Collective.findById(
    req.remoteUser.CollectiveId,
  );
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

export function editCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to edit a collective',
    });
  }

  if (!args.collective.id) {
    return Promise.reject(
      new errors.ValidationFailed({ message: 'collective.id required' }),
    );
  }

  const location = args.collective.location || {};

  const updatedCollectiveData = {
    ...args.collective,
    locationName: location.name,
    address: location.address,
    LastEditedByUserId: req.remoteUser.id,
  };

  updatedCollectiveData.type = updatedCollectiveData.type || 'COLLECTIVE';

  if (location.lat) {
    updatedCollectiveData.geoLocationLatLong = {
      type: 'Point',
      coordinates: [location.lat, location.long],
    };
  }

  let collective, parentCollective;

  const promises = [
    req.loaders.collective.findById.load(args.collective.id).then(c => {
      if (!c)
        throw new Error(`Collective with id ${args.collective.id} not found`);
      collective = c;
    }),
  ];

  if (args.collective.ParentCollectiveId) {
    promises.push(
      req.loaders.collective.findById
        .load(args.collective.ParentCollectiveId)
        .then(pc => {
          if (!pc)
            return Promise.reject(
              new Error(
                `Parent collective with id ${
                  args.collective.ParentCollectiveId
                } not found`,
              ),
            );
          parentCollective = pc;
        }),
    );
  }
  return Promise.all(promises)
    .then(() => {
      if (args.collective.slug && updatedCollectiveData.type === 'EVENT') {
        // To ensure uniqueness of the slug, if the type of collective is not COLLECTIVE (e.g. EVENT)
        // we force the slug to be of the form of `${slug}-${ParentCollectiveId}${collective.type.substr(0,2)}`
        const slug = slugify(
          args.collective.slug.replace(/(\-[0-9]+[a-z]{2})$/i, '') ||
            args.collective.name,
        );
        updatedCollectiveData.slug = `${slug}-${
          parentCollective.id
        }${collective.type.substr(0, 2)}`.toLowerCase();
      }
      if (updatedCollectiveData.type === 'EVENT') {
        return (
          req.remoteUser.id === collective.CreatedByUserId ||
          req.remoteUser.hasRole(
            ['ADMIN', 'HOST', 'BACKER'],
            parentCollective.id,
          )
        );
      } else {
        return (
          req.remoteUser.id === collective.CreatedByUserId ||
          req.remoteUser.hasRole(['ADMIN', 'HOST'], updatedCollectiveData.id)
        );
      }
    })
    .then(canEditCollective => {
      if (!canEditCollective) {
        let errorMsg;
        switch (updatedCollectiveData.type) {
          case types.EVENT:
            errorMsg = `You must be logged in as the creator of this Event or as an admin of the ${
              parentCollective.slug
            } collective to edit this Event Collective`;
            break;

          case types.USER:
            errorMsg = `You must be logged in as ${
              updatedCollectiveData.name
            } to edit this User Collective`;
            break;

          default:
            errorMsg = `You must be logged in as an admin or as the host of this ${updatedCollectiveData.type.toLowerCase()} collective to edit it`;
        }
        return Promise.reject(new errors.Unauthorized({ message: errorMsg }));
      }
    })
    .then(() => {
      // If we try to change the host
      if (
        updatedCollectiveData.HostCollectiveId !== undefined &&
        updatedCollectiveData.HostCollectiveId !== collective.HostCollectiveId
      ) {
        return collective.changeHost(
          { id: updatedCollectiveData.HostCollectiveId },
          req.remoteUser,
        );
      }
    })
    .then(() => collective.update(updatedCollectiveData))
    .then(() => collective.editTiers(args.collective.tiers))
    .then(() =>
      collective.editMembers(args.collective.members, {
        CreatedByUserId: req.remoteUser.id,
      }),
    )
    .then(() =>
      collective.editPaymentMethods(args.collective.paymentMethods, {
        CreatedByUserId: req.remoteUser.id,
      }),
    )
    .then(() => collective);
}

export async function approveCollective(remoteUser, CollectiveId) {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to approve a collective',
    });
  }

  const collective = await models.Collective.findById(CollectiveId);
  if (!collective) {
    throw new errors.NotFound({
      message: `Collective with id ${CollectiveId} not found`,
    });
  }

  const hostCollective = await collective.getHostCollective();

  if (!remoteUser.isAdmin(hostCollective.id)) {
    throw new errors.Unauthorized({
      message:
        'You need to be logged in as an admin of the host of this collective to approve it',
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

  return models.Collective.findById(args.id).then(collective => {
    if (!collective)
      throw new errors.NotFound({
        message: `Collective with id ${args.id} not found`,
      });
    if (
      !req.remoteUser.isAdmin(collective.id) &&
      !req.remoteUser.isAdmin(collective.ParentCollectiveId)
    ) {
      throw new errors.Unauthorized({
        message:
          'You need to be logged in as a core contributor or as a host to delete this collective',
      });
    }

    return collective.destroy();
  });
}
