'use strict';

const githubHandleColumn = 'githubHandle';

module.exports = {
  /**
   * Max length for Github username is 39. Max length for repository name is
   * 100, so `username/repo` will be at max 140 characters.
   * The default Sequelize.String length, 255, is large enough for this.
   */
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .changeColumn('Collectives', githubHandleColumn, {
        type: Sequelize.STRING(255),
      })
      .then(() => {
        queryInterface.changeColumn('CollectiveHistories', githubHandleColumn, {
          type: Sequelize.STRING(255),
        });
      })
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE
            "Collectives" 
          SET
            "twitterHandle" = regexp_replace("twitterHandle", '(https?://)?twitter.com/', ''),
            "githubHandle" = regexp_replace("githubHandle", '(https?://)?github.com/', '')
          WHERE
            "twitterHandle" like '%twitter.com/%'
          OR
            "githubHandle" like '%github.com/%'
      `);
      });
  },

  down: (queryInterface, Sequelize) => {
    // Rollbacking this presents a risk of curupting the data. As the length
    // of the varchar has no perfomances impact (it's only used for validation)
    // the tradeoff is not worth it.
  },
};
