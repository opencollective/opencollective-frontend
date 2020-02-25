import { GraphQLNonNull, GraphQLBoolean } from 'graphql';
import { get, pick } from 'lodash';

import { Collective } from '../object/Collective';
import { CollectiveCreate } from '../input/CollectiveCreate';
import { AccountInput, fetchAccountWithInput } from '../input/AccountInput';

import * as errors from '../../errors';
import models from '../../../models';
import roles from '../../../constants/roles';
import activities from '../../../constants/activities';
import * as github from '../../../lib/github';
import { purgeCacheForPage } from '../../../lib/cloudflare';
import { defaultHostCollective } from '../../../lib/utils';

const DEFAULT_COLLECTIVE_SETTINGS = {
  features: { conversations: true },
};

async function createCollective(_, args, req) {
  let shouldAutomaticallyApprove = false;

  const { remoteUser, loaders } = req;

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
    throw new Error(
      `The slug ${
        collectiveData.slug
      } is already taken. Please use another slug for your ${collectiveData.type.toLowerCase()}.`,
    );
  }

  let host;
  if (args.host) {
    host = fetchAccountWithInput(args.host, { loaders });
    if (!host) {
      throw new errors.ValidationFailed({ message: 'Host Not Found' });
    }
  }

  // Handle GitHub automated approval for the Open Source Collective Host
  if (args.automateApprovalWithGithub && args.githubHandle) {
    const opensourceHost = defaultHostCollective('opensource');
    if (host.id === opensourceHost.CollectiveId) {
      try {
        const githubAccount = await models.ConnectedAccount.findOne({
          where: { CollectiveId: remoteUser.CollectiveId, service: 'github' },
        });
        if (!githubAccount) {
          throw new Error('You must have a connected GitHub Account to claim a collective');
        }
        github.handleOpenSourceAutomatedApproval(args.githubHandle, githubAccount.token);
        shouldAutomaticallyApprove = true;
      } catch (error) {
        throw new errors.ValidationFailed({
          message: error.message,
        });
      }
      if (args.githubHandle.includes('/')) {
        collectiveData.settings.githubRepo = args.githubHandle;
      } else {
        collectiveData.settings.githubOrg = args.githubHandle;
      }
    }
  }

  const collective = await models.Collective.create(collectiveData);

  // Add authenticated user as an admin
  await collective.addUserWithRole(remoteUser, roles.ADMIN, { CreatedByUserId: remoteUser.id });

  // Add the host if any
  if (host) {
    await collective.addHost(host, remoteUser, { shouldAutomaticallyApprove });
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
      automateApprovalWithGithub: {
        type: GraphQLBoolean,
        defaultValue: false,
      },
    },
    resolve: (_, args, req) => {
      return createCollective(_, args, req);
    },
  },
};

export default createCollectiveMutations;
