/**
 * Dependencies.
 */
import pg from 'pg';
import Sequelize from 'sequelize';
import { database as config } from 'config';

// this is needed to prevent sequelize from converting integers to strings, when model definition isn't clear
// like in case of the key totalDonations and raw query (like User.getTopBackers())
pg.defaults.parseInt8 = true;

/**
 * Database connection.
 */
console.log(`Connecting to postgres://${config.options.host}/${config.database}`);

// If we launch the process with DEBUG=psql, we log the postgres queries
if (process.env.DEBUG && process.env.DEBUG.match(/psql/)) {
  config.options.logging = true;
}

if (config.options.logging) {
  if (process.env.NODE_ENV === 'production') {
    config.options.logging = (query, executionTime) => {
      console.log(query.slice(0, 100), '|', executionTime, 'ms');
    }
  } else {
    config.options.logging = (query, executionTime) => {
      console.log(`\n-------------------- <query> --------------------\n`,query,`\n-------------------- </query executionTime="${executionTime}"> --------------------\n`);
    }
  }
}

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config.options
);

const models = setupModels(sequelize);
export default models;

/**
 * Separate function to be able to use in scripts
 */
export function setupModels(client) {
  const m = {}; // models

  /**
   * Models.
   */

  [
    'Activity',
    'Comment',
    'ConnectedAccount',
    'Donation',
    'Event',
    'Expense',
    'Group',
    'Notification',
    'PaymentMethod',
    'Response',
    'Session',
    'StripeAccount',
    'Subscription',
    'Tier',
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
  m.Group.hasMany(m.UserGroup);

  // StripeAccount
  m.User.belongsTo(m.StripeAccount); // Add a StripeAccountId to User

  // ConnectedAccount
  m.User.hasMany(m.ConnectedAccount);
  m.ConnectedAccount.belongsTo(m.User);
  m.Group.hasMany(m.ConnectedAccount);
  m.ConnectedAccount.belongsTo(m.Group);

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

  // Expense
  m.Expense.belongsTo(m.User);
  m.Expense.belongsTo(m.Group);
  m.Transaction.belongsTo(m.Expense);

  // Comment
  m.Comment.belongsTo(m.User);
  m.Comment.belongsTo(m.Group);
  m.Comment.belongsTo(m.Expense);
  m.Expense.hasMany(m.Comment);
  m.User.hasMany(m.Comment);
  m.Group.hasMany(m.Comment);

  // Donation.
  m.Donation.belongsTo(m.User);
  m.User.hasMany(m.Donation);
  m.Donation.belongsTo(m.Group);
  m.Group.hasMany(m.Donation);
  m.Transaction.belongsTo(m.Donation);
  m.Donation.hasMany(m.Transaction);
  m.Donation.belongsTo(m.Response);
  m.Response.hasOne(m.Donation);

  // Subscription
  m.Donation.belongsTo(m.Subscription);
  m.Subscription.hasOne(m.Donation);

  // PaymentMethod
  m.Donation.belongsTo(m.PaymentMethod);
  m.PaymentMethod.hasMany(m.Donation);

  // Event
  m.Event.belongsTo(m.Group);
  m.Group.hasMany(m.Event);

  // Tier
  m.Tier.belongsTo(m.Event);
  m.Event.hasMany(m.Tier);

  // Response
  m.Response.belongsTo(m.Event);
  m.Response.belongsTo(m.Tier);
  m.Response.belongsTo(m.Group);
  m.Response.belongsTo(m.User);
  m.Event.hasMany(m.Response);
  m.Tier.hasMany(m.Response);
  m.Group.hasMany(m.Response);
  m.User.hasMany(m.Response);

  return m;
}
