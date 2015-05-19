'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('StripeManagedAccounts', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      stripeId: DataTypes.STRING,
      stripeSecret: DataTypes.STRING,
      stripeKey: DataTypes.STRING,
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      deletedAt: {
        type: DataTypes.DATE
      }
    }).then(function() {
      return queryInterface.addColumn('Groups', 'StripeManagedAccountId', {
        type: DataTypes.INTEGER,
        references: 'StripeManagedAccounts',
        referencesKey: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    });
  },
  down: function (queryInterface, DataTypes) {
    return queryInterface.removeColumn('Groups', 'StripeManagedAccountId')
      .then(function () {
        queryInterface.dropTable('StripeManagedAccounts');
      });
  }
};

/*
CREATE TABLE IF NOT EXISTS "StripeManagedAccounts" ("id"   SERIAL , "stripeId" VARCHAR(255), "stripeSecret" VARCHAR(255),
 "stripeKey" VARCHAR(255), "createdAt" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP WITH TIME ZONE,
 "deletedAt" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE TABLE IF NOT EXISTS "Groups" ("id"   SERIAL , "name" VARCHAR(255) NOT NULL, "description" VARCHAR(255),
 "budget" FLOAT, "currency" VARCHAR(255) DEFAULT 'USD', "membership_type" "enum_Groups_membership_type", "membershipfee" FLOAT,
 "createdAt" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE,
 "StripeManagedAccountId" INTEGER REFERENCES "StripeManagedAccounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
 PRIMARY KEY ("id"));
*/
