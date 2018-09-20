import Liana from 'forest-express-sequelize';

Liana.collection('Collective', {
  actions: [
    {
      name: 'Delete collective and dependencies',
      fields: [
        {
          field: 'Confirmation',
          type: 'Boolean',
          description:
            'You are about to delete this collective and all its dependencies (Members, Unpaid Expenses, Tiers, Payment Methods). Check this box to proceed.',
          isRequired: true,
        },
      ],
    },
  ],
});
