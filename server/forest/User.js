import Liana from 'forest-express-sequelize';

Liana.collection('User', {
  fields: [{
    field: 'fullname',
    type: 'String',
    get: object => {
      return `${object.firstName || ''} ${object.lastName || ''}`.trim();
    }
  }]
});
