'use strict';

module.exports = {
  up: queryInterface => {
    return queryInterface.addIndex('Comments', ['ConversationId', 'createdAt'], {
      indexName: `Comments_ConversationId_createdAt`,
    });
  },

  down: queryInterface => {
    return queryInterface.removeIndex('Comments', 'Comments_ConversationId_createdAt');
  },
};
