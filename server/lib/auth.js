import config from 'config';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import models, { Op } from '../models';
import Promise from 'bluebird';
import * as errors from '../graphql/errors';

// Helper
const daysToSeconds = days => moment.duration({ days }).asSeconds();

/* Constants that determin token expiration */
export const TOKEN_EXPIRATION_LOGIN = daysToSeconds(1);
export const TOKEN_EXPIRATION_CONNECTED_ACCOUNT = daysToSeconds(1);
export const TOKEN_EXPIRATION_SESSION = daysToSeconds(90);

/** Generate a JWToken with the received parameters */
export function createJwt(subject, payload, expiresIn) {
  return jwt.sign(payload, config.keys.opencollective.jwtSecret, { expiresIn, subject });
}

/** Verify JWToken */
export function verifyJwt(token) {
  return jwt.verify(token, config.keys.opencollective.jwtSecret);
}

/**
 * Returns the subset of [User|Organization]CollectiveIds that the remoteUser has access to
 */
export function getListOfAccessibleMembers(remoteUser, CollectiveIds) {
  if (!remoteUser) return Promise.resolve([]);
  if (!remoteUser.rolesByCollectiveId) return Promise.resolve([]);
  // all the CollectiveIds that the remoteUser is admin of.
  const adminOfCollectives = Object.keys(remoteUser.rolesByCollectiveId).filter(CollectiveId =>
    remoteUser.isAdmin(CollectiveId),
  );
  return models.Member.findAll({
    attributes: ['MemberCollectiveId'],
    where: {
      MemberCollectiveId: { [Op.in]: CollectiveIds },
      CollectiveId: { [Op.in]: adminOfCollectives },
    },
    group: ['MemberCollectiveId'],
  }).then(results => results.map(r => r.MemberCollectiveId));
}

export function mustBeLoggedInTo(remoteUser, action = 'do this') {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: `You must be logged in to ${action}`,
    });
  }
}

export function mustHaveRole(remoteUser, roles, CollectiveId, action = 'perform this action') {
  mustBeLoggedInTo(remoteUser, action);
  if (!CollectiveId || !remoteUser.hasRole(roles, CollectiveId)) {
    throw new errors.Unauthorized({
      message: `You don't have sufficient permissions to ${action}`,
    });
  }
}
