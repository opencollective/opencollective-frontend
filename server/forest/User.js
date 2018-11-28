import Liana from 'forest-express-sequelize';

Liana.collection('User', {
  fields: [
    {
      field: 'fullname',
      type: 'String',
      get: object => {
        return `${object.firstName || ''} ${object.lastName || ''}`.trim();
      },
    },
  ],
  actions: [
    {
      name: 'Delete user and dependencies',
      fields: [
        {
          field: 'Confirmation',
          type: 'Boolean',
          description:
            'You are about to delete this user and all its dependencies (Memberships, Unpaid Expenses, Payment Methods, User Collective). Check this box to proceed.',
          isRequired: true,
        },
      ],
    },
    {
      name: 'Delete user and merge',
      fields: [
        {
          field: 'User ID',
          type: 'Number',
          description: 'After deleting, merge data (Memberships, Unpaid Expenses, Payment Methods) into this user.',
          isRequired: true,
        },
        {
          field: 'Confirmation',
          type: 'Boolean',
          description: 'You are about to delete this user and all its dependencies. Check this box to proceed.',
          isRequired: true,
        },
      ],
    },
  ],
});
