import config from 'config';
import request from 'request-promise';
import Promise from 'bluebird';
import models from '../models';
import errors from '../lib/errors';

const {
  ConnectedAccount,
  User
} = models;

export const list = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  models.Collective.findBySlug(slug)
    .then(collective => {
      return models.ConnectedAccount.findAll({
        where: { CollectiveId: collective.id }
      });
    })
    .map(connectedAccount => connectedAccount.info)
    .tap(connectedAccounts => res.json({connectedAccounts}))
    .catch(next);
};

export const createOrUpdate = (req, res, next, accessToken, data, emails) => {
  const service = req.params.service;
  const redirect = `${config.host.website}/${req.query.slug}/edit#connectedAccounts`;

  switch (service) {
    case 'github': {
      const attrs = { service };
      let caId, user;
      const utmSource = req.query.utm_source;
      const image = `https://images.githubusercontent.com/${data.profile.username}`;
      // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
      // https://github.com/sequelize/sequelize/issues/4631
      return User.findOne({ where: { email: { $in: emails.map(email => email.toLowerCase()) } } })
        .then(u => u || User.createUserWithCollective({
          name: data.profile.displayName || data.profile.username,
          image,
          email: emails[0],
        }))
        .tap(u => user = u)
        .tap(user => attrs.CollectiveId = user.CollectiveId)
        .then(() => ConnectedAccount.findOne({ where: { service, CollectiveId: user.CollectiveId} }))
        .then(ca => ca || ConnectedAccount.create({ ...attrs, CreatedByUserId: user.id }))
        .then(ca => {
          caId = ca.id;
          return ca.update({ username: data.profile.username, token: accessToken });
        })
        .then(() => {
          const token = user.generateConnectedAccountVerifiedToken(caId, data.profile.username);
          res.redirect(`${config.host.website}/github/apply/${token}?utm_source=${utmSource}`);
        })
        .catch(next);
    }
    case 'meetup':
      createConnectedAccountForCollective(req.query.CollectiveId, service)
        .then(ca => ca.update({
          clientId: accessToken,
          token: data.tokenSecret,
          CreatedByUserId: req.remoteUser.id
        }))
        .then(() => res.redirect(redirect))
        .catch(next);
      break;

    case 'twitter':
      createConnectedAccountForCollective(req.query.CollectiveId, service)
        .then(ca => ca.update({
          username: data.profile.username,
          clientId: accessToken,
          token: data.tokenSecret,
          CreatedByUserId: req.remoteUser.id
        }))
        .then(() => res.redirect(redirect))
        .catch(next);
      break;

    default:
      return next(new errors.BadRequest(`unsupported service ${service}`));
  }
};

export const get = (req, res, next) => {
  const payload = req.jwtPayload;
  const service = req.params.service;
  if (!payload) return next(new errors.Unauthorized());
  if (payload.scope === 'connected-account' && payload.username) {
    res.send({service, username: payload.username, connectedAccountId: payload.connectedAccountId})
  } else {
    return next(new errors.BadRequest('Github authorization failed'));
  }
};

export const fetchAllRepositories = (req, res, next) => {
  const payload = req.jwtPayload;
  ConnectedAccount
  .findOne({where: {id: payload.connectedAccountId}})
  .then(ca => {

    return Promise.map([1,2,3,4,5], page => request({
      uri: 'https://api.github.com/user/repos',
      qs: {
        per_page: 100,
        sort: 'pushed',
        access_token: ca.token,
        type: 'all',
        page
      },
      headers: {
        'User-Agent': 'OpenCollective',
        'Accept': 'application/vnd.github.mercy-preview+json' // needed to fetch 'topics', which we can use as tags
      },
      json: true
    }))
    .then(data => [].concat(...data))
    .filter(repo => repo.permissions && repo.permissions.push && !repo.private)
  })
  .then(body => res.json(body))
  .catch(next);
};

function createConnectedAccountForCollective(CollectiveId, service) {
  const attrs = { service };
  return models.Collective.findById(CollectiveId)
    .tap(collective => attrs.CollectiveId = collective.id)
    .then(() => ConnectedAccount.findOne({ where: attrs }))
    .then(ca => ca || ConnectedAccount.create(attrs));
}
