/**
 * Dependencies.
 */
const Sequelize = require('sequelize');
const config = require('config').database;

/**
 * Database connection.
 */
console.log(`Connecting to postgres://${config.options.host}/${config.database}`);

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config.options
);

const models = setupModels(sequelize);

/**
 * Separate function to be able to use in scripts
 */
function setupModels(client) {
  var m = {}; // models

  /**
   * Models.
   */

  [
    'Activity',
    'Application',
    'Donation',
    'PaymentMethod',
    'Group',
    'ConnectedAccount',
    'StripeAccount',
    'Notification',
    'Subscription',
    'Transaction',
    'User',
    'UserGroup'
  ].forEach((model) => {
    m[model] = client.import(`${__dirname}/${model}`);
  });

  /**
   * Relationships
   */

  // PaymentMethod.
  m.PaymentMethod.belongsTo(m.User);

  // Referrer
  m.User.belongsTo(m.User, { as: 'referrer' });

  // Group.
  m.Group.belongsToMany(m.User, {through: {model: m.UserGroup, unique:false}, as: 'users'});
  m.User.belongsToMany(m.Group, {through: {model: m.UserGroup, unique: false}, as: 'groups'});

  // StripeAccount
  m.User.belongsTo(m.StripeAccount); // Add a StripeAccountId to User

  // ConnectedAccount
  m.User.hasMany(m.ConnectedAccount);
  m.ConnectedAccount.belongsTo(m.User);

  // Application - User.
  m.User.belongsTo(m.Application);
  m.Application.hasMany(m.User);

  // Activity.
  m.Activity.belongsTo(m.Group);
  m.Group.hasMany(m.Activity);

  m.Activity.belongsTo(m.User);
  m.User.hasMany(m.Activity);

  m.Activity.belongsTo(m.Transaction);

  // Notification.
  m.User.hasMany(m.Notification);
  m.Notification.belongsTo(m.User);

  m.Notification.belongsTo(m.Group);
  m.Group.hasMany(m.Notification);

  // Transaction.
  m.Transaction.belongsTo(m.Group);
  m.Group.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.User);
  m.User.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.PaymentMethod);
  m.PaymentMethod.hasMany(m.Transaction);

  // Donation.
  m.Donation.belongsTo(m.User);
  m.User.hasMany(m.Donation);
  m.Donation.belongsTo(m.Group);
  m.Group.hasMany(m.Donation);
  m.Transaction.belongsTo(m.Donation);
  m.Donation.hasMany(m.Transaction);

  // Application.
  m.Application.belongsToMany(m.Group, {through: 'ApplicationGroup'});
  m.Group.belongsToMany(m.Application, {through: 'ApplicationGroup'});

  // Subscription
  m.Transaction.belongsTo(m.Subscription);
  m.Subscription.hasMany(m.Transaction);
  m.Donation.belongsTo(m.Subscription);

  return m;
};

/**
 * Exports.
 */
module.exports = models;
module.exports.sequelize = sequelize;
module.exports.setupModels = setupModels;
