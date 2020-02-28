import { GraphQLNonNull, GraphQLBoolean } from 'graphql';
import { get, pick } from 'lodash';

import { Collective } from '../object/Collective';
import { CollectiveCreateInput } from '../input/CollectiveCreateInput';
import { AccountReferenceInput, fetchAccountWithReference } from '../input/AccountReferenceInput';

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
    throw new errors.Unauthorized({ message: 'You need to be logged in to create a collective' });
  }

  const collectiveData = {
    ...pick(args.collective, ['name', 'slug', 'description', 'tags']),
    isActive: false,
    CreatedByUserId: remoteUser.id,
    settings: { ...DEFAULT_COLLECTIVE_SETTINGS },
  };

  const collectiveWithSlug = await models.Collective.findOne({ where: { slug: collectiveData.slug.toLowerCase() } });
  if (collectiveWithSlug) {
    throw new Error(`The slug ${collectiveData.slug} is already taken. Please use another slug for your collective.`);
  }

  let host;

  // Handle GitHub automated approval and apply to the Open Source Collective Host
  if (args.automateApprovalWithGithub && args.collective.githubHandle) {
    const githubHandle = args.collective.githubHandle;
    const opensourceHost = defaultHostCollective('opensource');
    host = await loaders.Collective.byId.load(opensourceHost.CollectiveId);
    try {
      const githubAccount = await models.ConnectedAccount.findOne({
        where: { CollectiveId: remoteUser.CollectiveId, service: 'github' },
      });
      if (!githubAccount) {
        throw new Error('You must have a connected GitHub Account to create a collective with GitHub.');
      }
      await github.checkGithubAdmin(githubHandle, githubAccount.token);
      await github.checkGithubStars(githubHandle, githubAccount.token);
      shouldAutomaticallyApprove = true;
    } catch (error) {
      throw new errors.ValidationFailed({ message: error.message });
    }
    if (githubHandle.includes('/')) {
      collectiveData.settings.githubRepo = githubHandle;
    } else {
      collectiveData.settings.githubOrg = githubHandle;
    }
    collectiveData.tags = collectiveData.tags || [];
    if (!collectiveData.tags.includes('open source')) {
      collectiveData.tags.push('open source');
    }
  } else if (args.host) {
    host = await fetchAccountWithReference(args.host, { loaders });
    if (!host) {
      throw new errors.ValidationFailed({ message: 'Host Not Found' });
    }
    if (!host.isHostAccount) {
      throw new errors.ValidationFailed({ message: 'Host account is not activated as Host.' });
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
  const remoteUserCollective = await loaders.Collective.byId.load(remoteUser.CollectiveId);
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
        description: 'Information about the collective to create (name, slug, description, tags, ...)',
        type: new GraphQLNonNull(CollectiveCreateInput),
      },
      host: {
        description: 'Reference to the host to apply on creation.',
        type: AccountReferenceInput,
      },
      automateApprovalWithGithub: {
        description: 'Wether to trigger the automated approval for Open Source collectives with GitHub.',
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
