/**
 * Dependencies.
 */
var Sequelize = require('sequelize');
var config = require('config').database;

/**
 * Database connection.
 */
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
  'StripeManagedAccount',
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
  m.Card.belongsTo(m.Group);

  // Group.
  m.Group.belongsToMany(m.User, {through: m.UserGroup, as: 'members'});
  m.User.belongsToMany(m.Group, {through: m.UserGroup, as: 'groups'});

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

  // Stripe Managed Account.
  m.StripeManagedAccount.hasMany(m.Group);
  m.Group.belongsTo(m.StripeManagedAccount);

})(module.exports);

/**
 * Exports.
 */
module.exports.sequelize = sequelize;
