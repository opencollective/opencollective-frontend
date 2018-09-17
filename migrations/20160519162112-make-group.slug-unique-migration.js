'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.addIndex('Groups', ['slug'], {
      indexName: 'UniqueSlugIndex',
      indicesType: 'UNIQUE',
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeIndex('Groups', 'UniqueSlugIndex');
  },
};
