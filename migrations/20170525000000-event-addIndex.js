'use strict';

module.exports = {
  up: function(queryInterface) {
    return queryInterface.addIndex('Events', ['GroupId', 'slug'], {
      indexName: 'UniqueGroupIdSlugIndex',
      indicesType: 'UNIQUE',
    });
  },

  down: function(queryInterface) {
    return queryInterface.removeIndex('Events', 'UniqueGroupIdSlugIndex');
  },
};
