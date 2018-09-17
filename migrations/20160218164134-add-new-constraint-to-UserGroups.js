'use strict';

module.exports = {
  up: function(queryInterface) {
    // We need to manually drop the constraint before old index can be removed
    // http://stackoverflow.com/questions/29518786/remove-constraints-in-sequelize-migration
    queryInterface.sequelize.query(
      'ALTER TABLE "UserGroups" DROP CONSTRAINT "UserGroups_pkey";',
    );

    return queryInterface
      .removeIndex('UserGroups', 'UserGroups_pkey')
      .then(function() {
        return queryInterface.addIndex(
          'UserGroups',
          ['GroupId', 'UserId', 'role'],
          {
            indexName: 'UserGroups_3way',
            indicesType: 'UNIQUE',
          },
        );
      });
  },

  down: function(queryInterface) {
    queryInterface.sequelize.query(
      'ALTER TABLE "UserGroups" DROP CONSTRAINT "UserGroups_3way";',
    );

    return queryInterface
      .removeIndex('UserGroups', 'UserGroups_3way')
      .then(function() {
        return queryInterface.addIndex('UserGroups', ['GroupId', 'UserId'], {
          indexName: 'UserGroups_pkey',
          indicesType: 'UNIQUE',
        });
      });
  },
};
