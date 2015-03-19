/**
 * Dependencies.
 */
var Sequelize = require('sequelize')
  , config = require('config').database
  ;

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
  'Card',
  'Group',
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
  m.Card.belongsToMany(m.User, {through: 'UserCard'});
  m.User.belongsToMany(m.Card, {through: 'UserCard'});

  m.Group.belongsToMany(m.User, {through: m.UserGroup});
  m.User.belongsToMany(m.Group, {through: m.UserGroup});

  m.Activity.belongsTo(m.Group);
  m.Group.hasMany(m.Activity);
  
  m.Activity.belongsTo(m.User);
  m.User.hasMany(m.Activity);

  m.Transaction.belongsTo(m.Group);
  m.Group.hasMany(m.Transaction);
})(module.exports);

/**
 * Exports.
 */
module.exports.sequelize = sequelize;
