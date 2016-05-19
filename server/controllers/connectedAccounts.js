var async = require('async');
const config = require('config');
const roles = require('../constants/roles');

module.exports = (app) => {
  const errors = app.errors;
  const models = app.get('models');
  const ConnectedAccount = models.ConnectedAccount;
  const Activity = models.Activity;
  const User = models.User;
  const Group = models.Group;
  const groups = require('../controllers/groups')(app);
  const users = require('../controllers/users')(app);

  return {
    createOrUpdate: (req, res, next, accessToken, profile, emails) => {
      var caId, user;
      const attrs = { provider: req.params.service };

      // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
      // https://github.com/sequelize/sequelize/issues/4631
      User.findOne({ where: { email: { $in: emails }}})
        .then(u => u || User.create({
          name: profile.displayName,
          avatar: profile.avatar_url,
          email: emails[0]
        }))
        .tap(u => user = u)
        .tap(user => attrs.UserId = user.id)
        .then(() => ConnectedAccount.findOne({ where: attrs }))
        .then(ca => ca || ConnectedAccount.create(attrs))
        .then(ca => {
          caId = ca.id;
          return ca.update({ username: profile.username, secret: accessToken });
        })
        .then(() => {
          const token = user.generateConnectedAccountVerifiedToken(req.application, caId, profile.username);
          res.redirect(`${config.host.website}/github/apply/${token}`);
        })
        .catch(next);
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

    createGroupFromGithubRepo: (req, res, next) => {
      var payload = req.required.payload;

      const connectedAccountId = req.jwtPayload.connectedAccountId;

      var creator;
      const group = payload.group;
      const contributors = payload.users;
      const creatorGithubUsername = payload.github_username;

      ConnectedAccount
        .findOne({
          where: { id: connectedAccountId },
          include: { model: User }
        })
        .then(ca => creator = ca.User)
        .then(() => Group.create(group))
        .then(group => {

          const options = {
            role: roles.MEMBER,
            remoteUser: creator
          };
          async.auto({
            createActivity: (cb) => {
              Activity.create({
                type: 'group.created',
                UserId: creator.id,
                GroupId: group.id,
                data: {
                  group: group.info,
                  user: creator.info
                }
              }).done(cb);
            },

            addCreator: ['createActivity', (cb) => {
              groups._addUserToGroup(group, creator, options, cb);
            }],

            addContributors: ['addCreator', (cb) => {
              // TODO: find a cleaner way of doing this
              async.each(contributors, (user, callback) => {
                // since we added the creator above with an email, avoid double adding
                if (user !== creatorGithubUsername) {
                  var newUser = {
                    name: `${user}.github`,
                    email: `${user}.github@opencollective.com`, // TODO: see if we can get their real email
                    avatar: `http://avatars.githubusercontent.com/${user}`
                  };
                  users._create(newUser, (err, user) => {
                    if (err) callback(err);
                    groups._addUserToGroup(group, user, options, callback);
                  })
                } else {
                  callback();
                }
              }, (err) => {
                if (err) return next(err);
                cb();
              });
            }]
          }, (e) => {
            if (e) return next(e);
              res.send({success:true});
          });
        })
        .catch(next);
    }
  };
};
