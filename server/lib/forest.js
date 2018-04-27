import path from 'path';
import Liana from 'forest-express-sequelize';

import models, {sequelize} from '../models';

export default (app) => {

  if (!process.env.FOREST_ENV_SECRET || !process.env.FOREST_AUTH_SECRET) {
    return;
  }

  app.use(Liana.init({
    modelsDir: path.resolve(__dirname, '../models'),
    configDir: path.resolve(__dirname, '../forest'),
    envSecret: process.env.FOREST_ENV_SECRET,
    authSecret: process.env.FOREST_AUTH_SECRET,
    sequelize: sequelize,
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

};
