const async = require('async');
const axios = require('axios');
const config = require('config');
var Sequelize = require('sequelize');
const setupModels = require('../app/models').setupModels;

/**
 * Hard code to avoid resetting the production db by mistake
 */
var sequelize = new Sequelize(
  'dd7n9gp6tr4u36',
  'oshthceeahwmdn',
  'JalG9GcCdddujhfRVlBV5TJRm3', {
    host: 'ec2-54-83-194-117.compute-1.amazonaws.com',
    "port": 5432,
    "dialect": "postgres",
    "protocol": "postgres",
    "logging": true,
    "dialectOptions": {
      "ssl": true
    }
});

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
