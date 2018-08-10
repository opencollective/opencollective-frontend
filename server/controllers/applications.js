import { get, has } from 'lodash';

import models from '../models';

import errors from '../lib/errors';

const { Application } = models;

async function getApp(appId) {
  appId = parseInt(appId, 10);
  if (appId) {
    const app = await Application.findById(appId);
    if (app) {
      return app;
    } else {
      throw new errors.NotFound(`Application '${appId}' not found`);
    }
  } else {
    throw new errors.ValidationFailed(`Invalid Application id`);
  }
}

export const create = async (req, res) => {
  const props = {};

  props.CreatedByUserId = req.remoteUser.id;

  props.name = get(req, 'body.name');
  props.description = get(req, 'body.description');
  props.callbackUrl = get(req, 'body.callbackUrl');

  const app = await Application.create(props);

  res.send(app.info);
}

export const read = async (req, res, next) => {
  getApp(req.params.id)
    .then(app => {
      res.send(app.info);
    })
    .catch(e => {
      next(e);
    });
}

export const update = async (req, res, next) => {
  try {
    const app = await getApp(req.params.id);
    if (req.remoteUser.id !== app.CreatedByUserId) {
      throw new errors.Forbidden(`Authenticated user is not the application owner.`);
    }
    const props = {};
    if (has(req, 'body.name')) {
      props.name = get(req, 'body.name');
    }
    if (has(req, 'body.description')) {
      props.description = get(req, 'body.description');
    }
    if (has(req, 'body.callbackUrl')) {
      props.callbackUrl = get(req, 'body.callbackUrl');
    }
    if (props) {
      await app.update(props);
    }
    const updatedApp = await Application.findById(app.id);
    res.send(updatedApp.info);
  } catch (e) {
    next(e);
  }
}

export const del = async (req, res, next) => {
  try {
    const app = await getApp(req.params.id);
    if (req.remoteUser.id !== app.CreatedByUserId) {
      throw new errors.Forbidden(`Authenticated user is not the application owner.`);
    }
    await app.destroy();
    res.send({ success: true });
  } catch (e) {
    next(e);
  }
}
