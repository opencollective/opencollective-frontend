import Promise from 'bluebird';
import { get } from 'lodash';
import config from 'config';

import models, { Op } from '../models';
import errors from '../lib/errors';
import paymentProviders from '../paymentProviders';
import * as github from '../lib/github';
import { mustBeLoggedInTo } from '../lib/auth';

const { ConnectedAccount, User } = models;

export const createOrUpdate = (req, res, next, accessToken, data, emails) => {
  const { utm_source, redirect } = req.query;
  const { service } = req.params;
  const attrs = { service };

  switch (service) {
    case 'github': {
      let fetchUserPromise, caId, user, userCollective;
      const profile = data.profile._json;
      const image = `https://avatars.githubusercontent.com/${data.profile.username}`;

      // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
      // https://github.com/sequelize/sequelize/issues/4631
      if (req.remoteUser) {
        fetchUserPromise = Promise.resolve(req.remoteUser);
      } else {
        fetchUserPromise = User.findOne({
          where: {
            email: { [Op.in]: emails.map(email => email.toLowerCase()) },
          },
        }).then(
          u =>
            u ||
            User.createUserWithCollective({
              name: profile.name || profile.login,
              image,
              email: emails[0],
            }),
        );
      }
      return fetchUserPromise
        .then(u => {
          user = u;
          attrs.CollectiveId = user.CollectiveId;
          attrs.clientId = profile.id;
          attrs.data = profile;
          attrs.CreatedByUserId = user.id;
          return models.Collective.findByPk(user.CollectiveId);
        })
        .then(c => {
          userCollective = c;
          userCollective.description = userCollective.description || profile.bio;
          userCollective.locationName = userCollective.locationName || profile.location;
          userCollective.website = userCollective.website || profile.blog || profile.html_url;
          userCollective.image = userCollective.image || image;
          userCollective.githubHandle = data.profile.username;
          userCollective.save();
        })
        .then(() =>
          ConnectedAccount.findOne({
            where: { service, CollectiveId: user.CollectiveId },
          }),
        )
        .then(ca => ca || ConnectedAccount.create(attrs))
        .then(ca => {
          caId = ca.id;
          return ca.update({
            username: data.profile.username,
            token: accessToken,
          });
        })
        .then(() => {
          const token = user.generateConnectedAccountVerifiedToken(caId, data.profile.username);
          const newLocation = redirect
            ? `${redirect}?token=${token}`
            : `${config.host.website}/github/apply/${token}?utm_source=${utm_source}`;

          res.redirect(newLocation);
        })
        .catch(next);
    }

    case 'meetup':
      return createConnectedAccountForCollective(req.query.CollectiveId, service)
        .then(ca =>
          ca.update({
            clientId: accessToken,
            token: data.tokenSecret,
            CreatedByUserId: req.remoteUser.id,
          }),
        )
        .then(() => res.redirect(redirect || `${config.host.website}/${req.query.slug}/edit/connected-accounts`))
        .catch(next);

    case 'twitter': {
      let collective;
      const profile = data.profile._json;

      return models.Collective.findByPk(req.query.CollectiveId)
        .then(c => {
          collective = c;
          collective.image =
            collective.image ||
            (profile.profile_image_url_https ? profile.profile_image_url_https.replace(/_normal/, '') : null);
          collective.description = collective.description || profile.description;
          collective.backgroundImage =
            collective.backgroundImage ||
            (profile.profile_banner_url ? `${profile.profile_banner_url}/1500x500` : null);
          collective.website = collective.website || profile.url;
          collective.locationName = collective.locationName || profile.location;
          collective.twitterHandle = profile.screen_name;
          collective.save();
        })
        .then(() => createConnectedAccountForCollective(req.query.CollectiveId, service))
        .then(ca =>
          ca.update({
            username: data.profile.username,
            clientId: accessToken,
            token: data.tokenSecret,
            data: data.profile._json,
            CreatedByUserId: req.remoteUser.id,
          }),
        )
        .then(() => res.redirect(redirect || `${config.host.website}/${collective.slug}/edit/connected-accounts`))
        .catch(next);
    }

    default:
      return next(new errors.BadRequest(`unsupported service ${service}`));
  }
};

export const disconnect = async (req, res) => {
  const { collectiveId: CollectiveId, service } = req.params;
  const { remoteUser } = req;

  try {
    mustBeLoggedInTo(remoteUser, 'disconnect this connected account');

    if (!remoteUser.isAdmin(CollectiveId)) {
      throw new errors.Unauthorized({
        message: 'You are either logged out or not authorized to disconnect this account',
      });
    }

    const account = await ConnectedAccount.findOne({
      where: { service, CollectiveId },
    });

    if (account) {
      await account.destroy();
    }

    res.send({
      deleted: true,
      service,
    });
  } catch (err) {
    res.send({
      error: {
        message: err.message,
      },
    });
  }
};

export const verify = (req, res, next) => {
  const payload = req.jwtPayload;
  const service = req.params.service;

  if (get(paymentProviders, `${service}.oauth.verify`)) {
    return paymentProviders[service].oauth.verify(req, res, next);
  }

  if (!payload) {
    return next(new errors.Unauthorized());
  }
  if (payload.scope === 'connected-account' && payload.username) {
    res.send({
      service,
      username: payload.username,
      connectedAccountId: payload.connectedAccountId,
    });
  } else {
    return next(new errors.BadRequest('Github authorization failed'));
  }
};

const getGithubAccount = async req => {
  const payload = req.jwtPayload;
  const githubAccount = await models.ConnectedAccount.findOne({
    where: { id: payload.connectedAccountId },
  });
  if (!githubAccount) {
    throw new errors.BadRequest('No connected GitHub Account');
  }
  return githubAccount;
};

// Use a 1 minutes timeout as the default 25 seconds can leads to failing requests.
const GITHUB_REPOS_FETCH_TIMEOUT = 1 * 60 * 1000;

// used in Frontend by createCollective "GitHub flow"
export const fetchAllRepositories = async (req, res, next) => {
  const githubAccount = await getGithubAccount(req);
  try {
    req.setTimeout(GITHUB_REPOS_FETCH_TIMEOUT);
    let repos = await github.getAllUserPublicRepos(githubAccount.token);
    if (repos.length !== 0) {
      repos = repos.filter(repo => {
        return repo.stargazers_count >= config.githubFlow.minNbStars && repo.fork === false;
      });
    }
    res.send(repos);
  } catch (e) {
    next(e);
  }
};

// used in Frontend by claimCollective
export const getRepo = async (req, res, next) => {
  const githubAccount = await getGithubAccount(req);
  try {
    const repo = await github.getRepo(req.query.name, githubAccount.token);
    res.send(repo);
  } catch (e) {
    next(e);
  }
};

// used in Frontend by claimCollective
export const getOrgMemberships = async (req, res, next) => {
  const githubAccount = await getGithubAccount(req);
  try {
    const memberships = await github.getOrgMemberships(githubAccount.token);
    res.send(memberships);
  } catch (e) {
    console.log(e);
    next(e);
  }
};

function createConnectedAccountForCollective(CollectiveId, service) {
  const attrs = { service };
  return models.Collective.findByPk(CollectiveId)
    .then(collective => (attrs.CollectiveId = collective.id))
    .then(() => ConnectedAccount.findOne({ where: attrs }))
    .then(ca => ca || ConnectedAccount.create(attrs));
}
