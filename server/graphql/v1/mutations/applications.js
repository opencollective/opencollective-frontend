import models from '../../../models';
import * as errors from '../../errors';
import { get } from 'lodash';

const { Application } = models;

function require(args, path) {
  if (!get(args, path))
    throw new errors.ValidationFailed({ message: `${path} required` });
}

export async function createApplication(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized(
      'You need to be authenticated to create an application.',
    );
  }

  require(args, 'application.name');

  const app = await Application.create({
    ...args.application,
    CreatedByUserId: req.remoteUser.id,
  });

  return app;
}

export async function updateApplication(_, args, req) {
  const app = await Application.findById(args.id);
  if (!app) {
    throw new errors.NotFound({
      message: `Application with id ${args.id} not found`,
    });
  }

  if (!req.remoteUser) {
    throw new errors.Unauthorized(
      'You need to be authenticated to update an application.',
    );
  } else if (req.remoteUser.id !== app.CreatedByUserId) {
    throw new errors.Forbidden(
      'Authenticated user is not the application owner.',
    );
  }

  return await app.update(args.application);
}

export async function deleteApplication(_, args, req) {
  const app = await Application.findById(args.id);
  if (!app) {
    throw new errors.NotFound({
      message: `Application with id ${args.id} not found`,
    });
  }

  if (!req.remoteUser) {
    throw new errors.Unauthorized(
      'You need to be authenticated to update an application.',
    );
  } else if (req.remoteUser.id !== app.CreatedByUserId) {
    throw new errors.Forbidden(
      'Authenticated user is not the application owner.',
    );
  }

  return await app.destroy();
}
