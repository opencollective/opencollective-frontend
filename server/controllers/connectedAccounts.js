import config from 'config';
import request from 'request-promise';
import Promise from 'bluebird';
import models from '../models';
import {getUserOrCollectiveFromSlug} from '../lib/slug';
import errors from '../lib/errors';

const {
  ConnectedAccount,
  User
} = models;

export const list = (req, res, next) => {
  const user = req.remoteUser;
  const slug = req.params.slug.toLowerCase();

  getUserOrCollectiveFromSlug(slug, user.id)
    .then(userOrCollective => {
      const selector = userOrCollective.username ? 'UserId' : 'CollectiveId';
      return models.ConnectedAccount.findAll({where: {
        [selector]: userOrCollective.id,
        deletedAt: null
      }});
    })
    .map(connectedAccount => connectedAccount.info)
    .tap(connectedAccounts => res.json({connectedAccounts}))
    .catch(next);
};

export const createOrUpdate = (req, res, next, accessToken, data, emails) => {
  const provider = req.params.service;

  switch (provider) {
    case 'github': {
      const attrs = {provider};
      let caId, user;
      const utmSource = req.query.utm_source;
      const image = `https://images.githubusercontent.com/${data.profile.username}`;
      // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
      // https://github.com/sequelize/sequelize/issues/4631
      return User.findOne({where: {email: {$in: emails.map(email => email.toLowerCase())}}})
        .then(u => u || User.create({
          name: data.profile.displayName,
          image,
          email: emails[0],
        }))
        .tap(u => user = u)
        .tap(user => attrs.UserId = user.id)
        .then(() => ConnectedAccount.findOne({where: attrs}))
        .then(ca => ca || ConnectedAccount.create(attrs))
        .then(ca => {
          caId = ca.id;
          return ca.update({username: data.profile.username, secret: accessToken});
        })
        .then(() => {
          const token = user.generateConnectedAccountVerifiedToken(caId, data.profile.username);
          res.redirect(`${config.host.website}/github/apply/${token}?utm_source=${utmSource}`);
        })
        .catch(next);
    }
    case 'meetup':
      createConnectedAccountForCollective(req.query.slug, provider)
        .then(ca => ca.update({
          clientId: accessToken,
          secret: data.tokenSecret
        }))
        .then(() => res.redirect(`${config.host.website}/${req.query.slug}`))
        .catch(next);
      break;

    case 'twitter':
      createConnectedAccountForCollective(req.query.slug, provider)
        .then(ca => ca.update({
          username: data.profile.username,
          clientId: accessToken,
          secret: data.tokenSecret
        }))
        .then(() => res.redirect(`${config.host.website}/${req.query.slug}/edit-twitter`))
        .catch(next);
      break;

    default:
      return next(new errors.BadRequest(`unsupported provider ${provider}`));
  }
};

export const get = (req, res, next) => {
  const payload = req.jwtPayload;
  const provider = req.params.service;
  if (!payload) return next(new errors.Unauthorized());
  if (payload.scope === 'connected-account' && payload.username) {
    res.send({provider, username: payload.username, connectedAccountId: payload.connectedAccountId})
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
        access_token: ca.secret,
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

function createConnectedAccountForCollective(slug, provider) {
  const attrs = { provider };
  return models.Collective.findOne({where: { slug }})
    .tap(collective => attrs.CollectiveId = collective.id)
    .then(() => ConnectedAccount.findOne({ where: attrs }))
    .then(ca => ca || ConnectedAccount.create(attrs));
}
