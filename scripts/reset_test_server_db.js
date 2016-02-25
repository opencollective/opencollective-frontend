const async = require('async');
const axios = require('axios');
const config = require('config');
var Sequelize = require('sequelize');
const setupModels = require('../app/models').setupModels;

var sequelize = new Sequelize(
  // Hard code to avoid resetting the production db by mistake
  'opencollective_testserver',
  config.database.username,
  config.database.password,
  config.database.options
);

/**
 * Copy app/models/index.js logic to get the sequelize models;
 */
const models = setupModels(sequelize);

const apiKey = '0ac43519edcf4421d80342403fb5985d';
const roles = require('../app/constants/roles');

const testUser = {
  email: 'testuser@opencollective.com',
  password: 'password'
};

if (config.env !== 'test_server') {
  console.log('wrong env', config.env);
  return;
}

async.auto({
  resetDb: (cb) => {
    sequelize.sync({force: true})
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
    console.log("createGroupAndAddUser!");
      
    models.Group.create({
      name: 'OpenCollective Test Group',
      description: 'OpenCollective test group',
      isPublic: true,
      slug: 'testcollective'
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
