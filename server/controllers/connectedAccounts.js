const config = require('config');
const request = require('request');
const Promise = require('bluebird');

module.exports = (app) => {
  const errors = app.errors;
  const models = app.get('models');
  const ConnectedAccount = models.ConnectedAccount;
  const User = models.User;
  const slugLib = require('../lib/slug')(app);

  return {
    list: (req, res, next) => {
      const user = req.remoteUser;
      const slug = req.params.slug.toLowerCase();

      slugLib.getUserOrGroupFromSlug(slug, user.id)
        .then(userOrGroup => {
          const selector = userOrGroup.username ? 'UserId' : 'GroupId';
          return models.ConnectedAccount.findAll({where: {
            [selector]: userOrGroup.id,
            deletedAt: null
          }});
        })
        .map(connectedAccount => connectedAccount.info)
        .tap(connectedAccounts => {
          console.log("connectedAccounts tap", {connectedAccounts});
          return res.json({connectedAccounts})
        })
        .catch(next);
    },

    createOrUpdate: (req, res, next, accessToken, data, emails) => {
      const provider = req.params.service;
      const attrs = { provider };

      switch (provider) {
        case 'github':
          var caId, user;
          const utmSource = req.query.utm_source;
          const avatar = `http://avatars.githubusercontent.com/${data.profile.username}`;
          // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
          // https://github.com/sequelize/sequelize/issues/4631
          return User.findOne({ where: { email: { $in: emails.map(email => email.toLowerCase()) }}})
            .then(u => u || User.create({
              name: data.profile.displayName,
              avatar,
              email: emails[0]
            }))
            .tap(u => user = u)
            .tap(user => attrs.UserId = user.id)
            .then(() => ConnectedAccount.findOne({ where: attrs }))
            .then(ca => ca || ConnectedAccount.create(attrs))
            .then(ca => {
              caId = ca.id;
              return ca.update({ username: data.profile.username, secret: accessToken });
            })
            .then(() => {
              const token = user.generateConnectedAccountVerifiedToken(req.application, caId, data.profile.username);
              res.redirect(`${config.host.website}/github/apply/${token}?utm_source=${utmSource}`);
            })
            .catch(next);
          break;

        case 'twitter':
          models.Group.findOne({where: { slug: req.query.slug }})
            .tap(group => attrs.GroupId = group.id)
            .then(() => ConnectedAccount.findOne({ where: attrs }))
            .then(ca => ca || ConnectedAccount.create(attrs))
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
    },

    get: (req, res, next) => {
      const payload = req.jwtPayload;
      const provider = req.params.service;
      if (payload.scope === 'connected-account' && payload.username) {
        res.send({provider, username: payload.username, connectedAccountId: payload.connectedAccountId})
      } else {
        return next(new errors.BadRequest('Github authorization failed'));
      }
    },

    fetchAllRepositories: (req, res, next) => {
      const payload = req.jwtPayload;
      ConnectedAccount
      .findOne({where: {id: payload.connectedAccountId}})
      .then(ca => {

        return Promise.map([1,2,3,4,5], page => {
          const options = {
            url: `https://api.github.com/user/repos?per_page=100&sort=pushed&access_token=${ca.secret}&type=all&page=${page}`,
            headers: {
              'User-Agent': 'OpenCollective'
            },
            json: true
          };
          return Promise.promisify(request, {multiArgs: true})(options).then(args => args[1])
        })
        .then(data => {
          const repositories = [];
          data.map(repos => repos.map(repo => {
            if (repo.permissions && repo.permissions.push) {
              repositories.push(repo);
            }
          }))
          return repositories;
        })
      })
      .then(body => res.json(body))
      .catch(next);
    }
  };
};
