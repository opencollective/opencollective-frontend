import { GraphQLNonNull } from 'graphql';
import { get, pick } from 'lodash';

import { Collective } from '../object/Collective';
import { CollectiveCreate } from '../input/CollectiveCreate';
import { AccountInput, fetchAccountWithInput } from '../input/AccountInput';

import * as errors from '../../errors';
import models from '../../../models';
import roles from '../../../constants/roles';
import activities from '../../../constants/activities';
import { purgeCacheForPage } from '../../../lib/cloudflare';

const DEFAULT_COLLECTIVE_SETTINGS = {
  features: { conversations: true },
};

async function createCollective(_, args, req) {
  const { remoteUser } = req;

  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to create a collective',
    });
  }

  const collectiveData = {
    ...pick(args.collective, ['name', 'slug', 'description', 'tags']),
    isActive: false,
    CreatedByUserId: remoteUser.id,
    settings: { ...DEFAULT_COLLECTIVE_SETTINGS },
  };

  const collectiveWithSlug = await models.Collective.findBySlug(collectiveData.slug.toLowerCase());
  if (collectiveWithSlug) {
    throw new errors.ValidationFailed({ message: 'Collective slug is already taken.' });
  }

  let host;
  if (args.host) {
    host = fetchAccountWithInput(args.host);
    if (!host) {
      throw new errors.ValidationFailed({ message: 'Host Not Found' });
    }
    if (req.remoteUser.hasRole([roles.ADMIN], host.id)) {
      collectiveData.isActive = true;
    }
    collectiveData.currency = host.currency;
    collectiveData.hostFeePercent = host.hostFeePercent;
  }

  const collective = await models.Collective.create(collectiveData);

  // Add authenticated user as an admin
  await collective.addUserWithRole(remoteUser, roles.ADMIN, { CreatedByUserId: remoteUser.id });

  if (host) {
    await collective.addHost(host, remoteUser);
    purgeCacheForPage(`/${host.slug}`);
  }

  // Will send an email to the authenticated user
  // - tell them that their collective was successfully created
  // - tell them that their collective is pending validation (which might be wrong if it was automatically approved)
  const remoteUserCollective = await models.Collective.findByPk(remoteUser.CollectiveId);
  models.Activity.create({
    type: activities.COLLECTIVE_CREATED,
    UserId: remoteUser.id,
    CollectiveId: get(host, 'id'),
    data: {
      collective: collective.info,
      host: get(host, 'info'),
      user: {
        email: remoteUser.email,
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
      host: {
        type: AccountInput,
      },
    },
    resolve: (_, args, req) => {
      return createCollective(_, args, req);
    },
  },
};

export default createCollectiveMutations;
