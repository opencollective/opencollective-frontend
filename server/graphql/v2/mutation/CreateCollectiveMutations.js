import { GraphQLInt, GraphQLNonNull } from 'graphql';
import { get, pick } from 'lodash';

import { Collective } from '../object/Collective';
import { CollectiveCreate } from '../input/CollectiveCreate';

import * as errors from '../../errors';
import models from '../../../models';
import roles from '../../../constants/roles';
import activities from '../../../constants/activities';
import { purgeCacheForPage } from '../../../lib/cloudflare';

const DEFAULT_COLLECTIVE_SETTINGS = {
  features: { conversations: true },
};

async function createCollective(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to create a collective',
    });
  }

  if (!args.collective.name) {
    throw new errors.ValidationFailed({ message: 'collective.name required' });
  }

  const collectiveArgs = pick(args.collective, ['name', 'slug', 'description']);

  const collectiveData = {
    ...collectiveArgs,
    isActive: false,
    CreatedByUserId: req.remoteUser.id,
    settings: { ...DEFAULT_COLLECTIVE_SETTINGS },
  };

  // TODO: check if slug is available

  let hostCollective;
  if (args.HostCollectiveId) {
    hostCollective = await req.loaders.Collective.byId.load(collectiveData.HostCollectiveId);
    if (!hostCollective) {
      throw new errors.ValidationFailed(`Host collective with id ${args.collective.HostCollectiveId} not found`);
    } else if (req.remoteUser.hasRole([roles.ADMIN], hostCollective.id)) {
      collectiveData.isActive = true;
    }
    collectiveData.currency = hostCollective.currency;
    collectiveData.hostFeePercent = hostCollective.hostFeePercent;
  }

  const collective = await models.Collective.create(collectiveData);

  // Add authenticated user as an admin
  await collective.addUserWithRole(req.remoteUser, roles.ADMIN, { CreatedByUserId: req.remoteUser.id });

  if (hostCollective) {
    await collective.addHost(hostCollective, req.remoteUser);
    purgeCacheForPage(`/${hostCollective.slug}`);
  }

  const remoteUserCollective = await models.Collective.findByPk(req.remoteUser.CollectiveId);

  // Will send an email to the authenticated user
  // Will tell them that their collective was successfully created
  // Will tell them that their collective is pending validation (which might be wrong)
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

const createCollectiveMutations = {
  createCollective: {
    type: Collective,
    args: {
      collective: {
        type: new GraphQLNonNull(CollectiveCreate),
      },
      HostCollectiveId: {
        type: GraphQLInt,
      },
    },
    resolve: (_, args, req) => {
      return createCollective(_, args, req);
    },
  },
};

export default createCollectiveMutations;
