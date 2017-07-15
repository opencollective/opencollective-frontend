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
    'Collective',
    'Notification',
    'PaymentMethod',
    'Response',
    'Session',
    'StripeAccount',
    'Subscription',
    'Tier',
    'Transaction',
    'User',
    'Roles'
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

  // Collective.
  m.Collective.belongsToMany(m.User, {through: {model: m.Roles, unique:false}, as: 'users'});
  m.User.belongsToMany(m.Collective, {through: {model: m.Roles, unique: false}, as: 'collectives'});
  m.User.hasMany(m.Roles);
  m.Collective.hasMany(m.Roles);

  // StripeAccount
  m.User.belongsTo(m.StripeAccount); // Add a StripeAccountId to User

  // ConnectedAccount
  m.User.hasMany(m.ConnectedAccount);
  m.ConnectedAccount.belongsTo(m.User);
  m.Collective.hasMany(m.ConnectedAccount);
  m.ConnectedAccount.belongsTo(m.Collective);

  // Activity.
  m.Activity.belongsTo(m.Collective);
  m.Collective.hasMany(m.Activity);

  m.Activity.belongsTo(m.User);
  m.User.hasMany(m.Activity);

  m.Activity.belongsTo(m.Transaction);

  // Notification.
  m.User.hasMany(m.Notification);
  m.Notification.belongsTo(m.User);

  m.Notification.belongsTo(m.Collective);
  m.Collective.hasMany(m.Notification);

  // Transaction.
  m.Transaction.belongsTo(m.Collective);
  m.Collective.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.User);
  m.Transaction.belongsTo(m.User, { as: 'Host' });
  m.User.hasMany(m.Transaction);
  m.Transaction.belongsTo(m.PaymentMethod);
  m.PaymentMethod.hasMany(m.Transaction);

  // Expense
  m.Expense.belongsTo(m.User);
  m.Expense.belongsTo(m.Collective);
  m.Transaction.belongsTo(m.Expense);

  // Comment
  m.Comment.belongsTo(m.User);
  m.Comment.belongsTo(m.Collective);
  m.Comment.belongsTo(m.Expense);
  m.Expense.hasMany(m.Comment);
  m.User.hasMany(m.Comment);
  m.Collective.hasMany(m.Comment);

  // Donation.
  m.Donation.belongsTo(m.User);
  m.User.hasMany(m.Donation);
  m.Donation.belongsTo(m.Collective);
  m.Collective.hasMany(m.Donation);
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
  m.Transaction.belongsTo(m.PaymentMethod);

  // Event
  m.Event.belongsTo(m.Collective);
  m.Collective.hasMany(m.Event);
  m.Collective.hasMany(m.Tier);

  // Tier
  m.Tier.belongsTo(m.Event);
  m.Tier.belongsTo(m.Collective);
  m.Event.hasMany(m.Tier);

  // Response
  m.Response.belongsTo(m.Event);
  m.Response.belongsTo(m.Tier);
  m.Response.belongsTo(m.Collective);
  m.Response.belongsTo(m.User);
  m.Event.hasMany(m.Response);
  m.Tier.hasMany(m.Response);
  m.Collective.hasMany(m.Response);
  m.User.hasMany(m.Response);
  m.User.hasMany(m.PaymentMethod);

  return m;
}
