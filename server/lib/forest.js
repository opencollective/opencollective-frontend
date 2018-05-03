import path from 'path';
import { cloneDeep } from 'lodash';
import Liana from 'forest-express-sequelize';

import models, { sequelize } from '../models';

const Op = sequelize.Sequelize.Op;

export default (app) => {

  if (!process.env.FOREST_ENV_SECRET || !process.env.FOREST_AUTH_SECRET) {
    return;
  }

  app.use(Liana.init({
    modelsDir: path.resolve(__dirname, '../models'),
    configDir: path.resolve(__dirname, '../forest'),
    envSecret: process.env.FOREST_ENV_SECRET,
    authSecret: process.env.FOREST_AUTH_SECRET,
    connections: [{ models: getForestModels(), options: sequelize.options }],
    sequelize: sequelize.Sequelize,
  }));

  app.post('/forest/actions/activate-subscription', Liana.ensureAuthenticated, (req, res) => {
    const data = req.body.data;
    const id = data.attributes.ids[0];
    models.Subscription
      .findOne({ where: { id } })
      .then(subscription => subscription.activate())
      .then(() => {
        res.status(200).send({success: 'The subscription was successfully activated.'});
      })
      .catch(e => {
        res.status(400).send({error: e.message});
      })
  });

  app.post('/forest/actions/cancel-subscription', Liana.ensureAuthenticated, (req, res) => {
    const data = req.body.data;
    const id = data.attributes.ids[0];
    models.Subscription
      .findOne({ where: { id } })
      .then(subscription => subscription.deactivate())
      .then(() => {
        res.status(200).send({success: 'The subscription was successfully canceled.'});
      })
      .catch(e => {
        res.status(400).send({error: e.message});
      })
  });

  app.post('/forest/actions/delete-collective-and-dependencies', Liana.ensureAuthenticated, async (req, res) => {
    const data = req.body.data;
    const id = data.attributes.ids[0];
    models.Collective
      .findOne({ where: { id } })
      .then(async collective => {
        // Check if we can delete the collective
        await models.Order
          .count({ where: { [Op.or]: [ { CollectiveId: collective.id }, { FromCollectiveId: collective.id } ] } })
          .then(count => {
            if (count > 0) throw Error('Can not delete collective with existing orders.');
          });
        await models.Expense
          .count({ where: { CollectiveId: collective.id, 'status': 'PAID' } })
          .then(count => {
            if (count > 0) throw Error('Can not delete collective with paid expenses.');
          });
        // Delete Expenses
        await models.Expense
          .findAll({ where: { CollectiveId: collective.id }})
          .then(expenses => {
            expenses.forEach(async expense => {
              await expense.destroy();
            });
          });
        // Delete Members
        await models.Member
          .findAll({ where: { CollectiveId: collective.id }})
          .then(members => {
            members.forEach(async member => {
              await member.destroy();
            });
          });
        // Delete Collective
        await collective.destroy();
      })
      .then(() => {
        const msg = 'The collective and its dependencies were successfully deleted.';
        res.status(200).send({
          html: `<p>${msg}</p>
                 <p><a href="../../../">Click here to continue</a>.</p>`
        });
      })
      .catch(e => {
        const msg = e.message;
        res.status(400).send({
          error: `There was an error while processing your request.\n
            "${msg}"\n
            Maybe you want to proceed manually?`
        });
      })
  });

};

function getForestModels () {
  const m = cloneDeep(models);

  // Customize Collective
  // --------------------

  // Hidden in Forest
  delete m.Collective.associations.Activities;
  delete m.Collective.associations.Notifications;
  delete m.Collective.associations.ConnectedAccounts;
  // Duplicates
  delete m.Collective.associations.members;
  delete m.Collective.associations.transactions;
  // Not working as expected
  delete m.Collective.associations.memberCollectives;
  delete m.Collective.associations.memberOfCollectives;
  // Missing relations
  m.Collective.hasMany(m.PaymentMethod);
  m.Collective.hasMany(m.Expense, { foreignKey: "CollectiveId", as: 'Expense'});
  m.Collective.hasMany(m.Member, { foreignKey: 'MemberCollectiveId', as: 'Membership' });
  delete m.Collective.associations.orders;
  m.Collective.hasMany(m.Order, { foreignKey: "CollectiveId", as: 'ReceivedOrders'});
  m.Collective.hasMany(m.Order, { foreignKey: "FromCollectiveId", as: 'IssuedOrders'});

  // Customize User
  // --------------

  // Hidden in Forest
  delete m.User.associations.Activities;
  delete m.User.associations.Notifications;
  delete m.User.associations.ConnectedAccounts;
  // Unclear (created by user)
  delete m.User.associations.Members;
  delete m.User.associations.PaymentMethods;
  delete m.User.associations.orders;

  return m;
}
