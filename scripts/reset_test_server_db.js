const async = require('async');
const axios = require('axios');
const config = require('config');

const apiKey = '0ac43519edcf4421d80342403fb5985d';
const app = require('../index');
const models = app.set('models');
const roles = require('../app/constants/roles');

const testUser = {
  email: 'testuser@opencollective.com',
  password: 'password'
};

async.auto({
  resetDb: (cb) => {
    app.set('models').sequelize.sync({force: true})
      .done(cb);
  },

  createApplication: ['resetDb', (cb) => {
    models.Application.create({
      name: 'test_server',
      api_key: apiKey,
      _access: 1
    })
    .done(cb);
  }],

  createTestUser: ['createApplication', (cb) => {
    models.User.create(testUser)
    .done(cb);
  }],

  createGroupAndAddUser: ['createTestUser', (cb, results) => {
    models.Group.create({
      name: 'OpenCollective Test Group',
      description: 'OpenCollective test group',
    })
    .then(group => {
      return group.addUser(results.createTestUser, {role: roles.HOST})
    })
    .then(() => cb())
    .catch(cb);
  }]
}, (err) => {
  if (err) console.log(err);
  process.exit();
});
