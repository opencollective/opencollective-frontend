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
  'Association',
  'Card',
  'User'
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

  m.Association.belongsToMany(m.User, {through: 'UserAssociation'});
  m.User.belongsToMany(m.Association, {through: 'UserAssociation'});

  m.Activity.belongsTo(m.Association);
  m.Association.hasMany(m.Activity);
  
  m.Activity.belongsTo(m.User);
  m.User.hasMany(m.Activity);
})(module.exports);

/**
 * Exports.
 */
module.exports.sequelize = sequelize;
