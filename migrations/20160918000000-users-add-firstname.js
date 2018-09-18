'use strict';

var Promise = require('bluebird');

const updateUsers = (sequelize, action) => {
  const updateUser = user => {
    switch (action) {
      case 'splitName':
        return splitName(user);
      case 'mergeFirstNameLastName':
        return mergeFirstNameLastName(user);
    }
  };

  const splitName = user => {
    if (!user.name) return;
    const tokens = user.name.split(' ');
    const firstName = tokens.shift();
    const lastName = tokens.join(' ');
    return sequelize.query(
      `UPDATE "Users" SET "firstName"=:firstName, "lastName"=:lastName WHERE id=:id`,
      { replacements: { id: user.id, firstName, lastName } },
    );
  };

  const mergeFirstNameLastName = user => {
    if (!user.firstName) return;
    const name = `${user.firstName} ${user.lastName}`;
    return sequelize.query(`UPDATE "Users" SET name=:name WHERE id=:id`, {
      replacements: { id: user.id, name },
    });
  };

  return sequelize
    .query(`SELECT * FROM "Users"`, { type: sequelize.QueryTypes.SELECT })
    .then(users => Promise.map(users, updateUser));
};

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Users', 'firstName', { type: Sequelize.STRING(128) })
      .then(() =>
        queryInterface.addColumn('Users', 'lastName', {
          type: Sequelize.STRING(128),
        }),
      )
      .then(() => updateUsers(queryInterface.sequelize, 'splitName'))
      .then(() => queryInterface.removeColumn('Users', 'name'));
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Users', 'name', { type: Sequelize.STRING(128) })
      .then(() =>
        updateUsers(queryInterface.sequelize, 'mergeFirstNameLastName'),
      )
      .then(() => queryInterface.removeColumn('Users', 'firstName'))
      .then(() => queryInterface.removeColumn('Users', 'lastName'));
  },
};
