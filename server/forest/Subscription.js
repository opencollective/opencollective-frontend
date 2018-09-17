import Liana from 'forest-express-sequelize';

Liana.collection('Subscription', {
  actions: [
    {
      name: 'Cancel subscription',
    },
    {
      name: 'Activate subscription',
    },
  ],
});
