/**
 * Dependencies.
 */
var Sequelize = require('sequelize');
var config = require('config').database;

/**
 * Database connection.
 */
console.log('Connecting to postgres://' + config.options.host + '/' + config.database);

var sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config.options
);

/**
 * Models.
 */
var models = [
  'Activity',
  'Application',
  'Card',
  'Group',
  'Paykey',
  'StripeAccount',
  'Transaction',
  'User',
  'UserGroup'
];
models.forEach(function(model) {
  module.exports[model] = sequelize.import(__dirname + '/' + model);
});

/**
 * Relationships.
 */
(function(m) {
  // Card.
  m.Card.belongsTo(m.User);
  m.Card.belongsTo(m.Group); // Not currently used

  // Group.
  m.Group.belongsToMany(m.User, {through: m.UserGroup, as: 'members'});
  m.User.belongsToMany(m.Group, {through: m.UserGroup, as: 'groups'});

  // Application - User.
  m.User.belongsTo(m.Application);
  m.Application.hasMany(m.User);

  // Activity.
  m.Activity.belongsTo(m.Group);
  m.Group.hasMany(m.Activity);

  m.Activity.belongsTo(m.User);
  m.User.hasMany(m.Activity);

  m.Activity.belongsTo(m.Transaction);

  // Transaction.
  m.Transaction.belongsTo(m.Group);
  m.Group.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.User);
  m.User.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.Card);
  m.Card.hasMany(m.Transaction);

  // Application.
  m.Application.belongsToMany(m.Group, {through: 'ApplicationGroup'});
  m.Group.belongsToMany(m.Application, {through: 'ApplicationGroup'});

  // Paypal Pay key.
  m.Paykey.belongsTo(m.Transaction);
  m.Transaction.hasMany(m.Paykey);

})(module.exports);

/**
 * Exports.
 */
module.exports.sequelize = sequelize;
