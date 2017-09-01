/**
 * Dependencies.
 */
import pg from 'pg';
import Sequelize from 'sequelize';
import { database as config } from 'config';

// this is needed to prevent sequelize from converting integers to strings, when model definition isn't clear
// like in case of the key totalOrders and raw query (like User.getTopBackers())
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
    'ConnectedAccount',
    'Order',
    'Expense',
    'Collective',
    'Notification',
    'PaymentMethod',
    'Member',
    'Session',
    'Subscription',
    'Tier',
    'Transaction',
    'User'
  ].forEach((model) => {
    m[model] = client.import(`${__dirname}/${model}`);
  });

  /**
   * Relationships
   */

  // PaymentMethod.
  m.PaymentMethod.belongsTo(m.Collective);

  // User
  m.User.hasMany(m.Activity);
  m.User.hasMany(m.Notification);
  m.User.hasMany(m.Transaction, { foreignKey: 'CreatedByUserId', as: 'transactions' });
  m.User.hasMany(m.Order, { foreignKey: 'CreatedByUserId', as: 'orders' });
  m.User.hasMany(m.PaymentMethod, { foreignKey: 'CreatedByUserId' });
  m.User.hasMany(m.Member, { foreignKey: 'CreatedByUserId' });
  m.User.hasMany(m.ConnectedAccount, { foreignKey: 'CreatedByUserId' });
  m.User.belongsTo(m.Collective, { as: 'collective', foreignKey: 'CollectiveId', constraints: false });
  
  // Members
  m.Member.belongsTo(m.User, { foreignKey: 'CreatedByUserId', as: 'createdByUser' });
  m.Member.belongsTo(m.Collective, { foreignKey: 'MemberCollectiveId', as: 'memberCollective' });
  m.Member.belongsTo(m.Collective, { foreignKey: 'CollectiveId', as: 'collective' });
  m.Member.belongsTo(m.Tier);

  // ConnectedAccount
  m.ConnectedAccount.belongsTo(m.Collective);

  // Activity.
  m.Activity.belongsTo(m.Collective);
  m.Activity.belongsTo(m.User);
  m.Activity.belongsTo(m.Transaction);

  // Notification.
  m.Notification.belongsTo(m.User);

  m.Notification.belongsTo(m.Collective);

  // Transaction.
  m.Transaction.belongsTo(m.Collective, { foreignKey: 'ToCollectiveId', as: 'toCollective' });
  m.Transaction.belongsTo(m.Collective, { foreignKey: 'FromCollectiveId', as: 'fromCollective' });

  m.Transaction.belongsTo(m.User, { foreignKey: 'CreatedByUserId', as: 'createdByUser' });
  m.Transaction.belongsTo(m.Collective, { foreignKey: 'HostCollectiveId', as: 'host' });
  m.Transaction.belongsTo(m.PaymentMethod);
  m.PaymentMethod.hasMany(m.Transaction);

  // Expense
  m.Expense.belongsTo(m.User);
  m.Expense.belongsTo(m.Collective);
  m.Transaction.belongsTo(m.Expense);

  // Order.
  m.Order.belongsTo(m.User, { foreignKey: 'CreatedByUserId', as: 'createdByUser' });
  m.Order.belongsTo(m.Collective, { foreignKey: 'FromCollectiveId', as: 'fromCollective' });
  m.Order.belongsTo(m.Collective, { foreignKey: 'ToCollectiveId', as: 'toCollective' });
  m.Order.belongsTo(m.Tier);
  // m.Collective.hasMany(m.Order); // makes the test `mocha test/graphql.transaction.test.js -g "insensitive" fail
  m.Transaction.belongsTo(m.Order);
  m.Order.hasMany(m.Transaction);
  m.Tier.hasMany(m.Order);

  // Subscription
  m.Order.belongsTo(m.Subscription); // adds SubscriptionId to the Orders table
  m.Subscription.hasOne(m.Order);

  // PaymentMethod
  m.Order.belongsTo(m.PaymentMethod, { foreignKey: 'PaymentMethodId', as: 'paymentMethod' });
  m.PaymentMethod.hasMany(m.Order);
  m.Transaction.belongsTo(m.PaymentMethod);

  // Tier
  m.Tier.belongsTo(m.Collective);

  Object.keys(m).forEach((modelName) => m[modelName].associate && m[modelName].associate(m));
  return m;
}
