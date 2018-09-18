'use strict';
var bcrypt = require('bcrypt');

var SALT_WORK_FACTOR = 10;

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      _access: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,

      username: {
        type: DataTypes.STRING,
        unique: true,
      },

      avatar: DataTypes.STRING,

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // need that? http://stackoverflow.com/questions/16356856/sequelize-js-custom-validator-check-for-unique-username-password
        validate: {
          len: {
            args: [6, 128],
            msg: 'Email must be between 6 and 128 characters in length',
          },
          isEmail: {
            msg: 'Email must be valid',
          },
        },
      },

      _salt: {
        type: DataTypes.STRING,
        defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR),
      },
      refresh_token: {
        type: DataTypes.STRING,
        defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR),
      },
      password_hash: DataTypes.STRING,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      seenAt: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
      },

      ApplicationId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Applications' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Users');
  },
};
