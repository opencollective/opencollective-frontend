import models from '../../../models';
import * as errors from '../../errors';
import { get } from 'lodash';
import config from 'config';

const { Application } = models;

function requireArgs(args, path) {
  if (!get(args, path)) {
    throw new errors.ValidationFailed({ message: `${path} required` });
  }
}

export async function createApplication(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized('You need to be authenticated to create an application.');
  }

  requireArgs(args, 'application.type');

  if (args.application.type === 'oauth') {
    requireArgs(args, 'application.name');
  }

  const numberOfAppsForThisUser = await Application.count({
    where: {
      CreatedByUserId: req.remoteUser.id,
    },
  });

  if (numberOfAppsForThisUser >= config.limits.maxNumberOfAppsPerUser) {
    throw new errors.RateLimitExceeded({
      message: 'You have reached the maximum number of applications for this user',
    });
  }

  const app = await Application.create({
    ...args.application,
    CreatedByUserId: req.remoteUser.id,
    CollectiveId: req.remoteUser.CollectiveId,
  });

  return app;
}

export async function deleteApplication(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized('You need to be authenticated to delete an application.');
  }

  const app = await Application.findByPk(args.id);
  if (!app) {
    throw new errors.NotFound({
      message: `Application with id ${args.id} not found`,
    });
  } else if (req.remoteUser.id !== app.CreatedByUserId) {
    throw new errors.Forbidden('Authenticated user is not the application owner.');
  }

  return await app.destroy();
}
