'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('GroupHistories', {
      id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      currency: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
      isPublic: DataTypes.BOOLEAN,
      longDescription: DataTypes.TEXT,
      logo: DataTypes.STRING,
      video: DataTypes.STRING,
      image: DataTypes.STRING,
      slug: DataTypes.STRING,
      website: DataTypes.STRING,
      twitterHandle: DataTypes.STRING,
      tiers: DataTypes.JSON,
      burnrate: DataTypes.INTEGER,
      mission: DataTypes.STRING,
      budget: DataTypes.INTEGER,
      expensePolicy: DataTypes.TEXT,
      backgroundImage: DataTypes.STRING,
      hostFeePercent: DataTypes.FLOAT,
      settings: DataTypes.JSON,
      whyJoin: DataTypes.TEXT,
      data: DataTypes.JSON,
      tags: DataTypes.ARRAY(DataTypes.STRING),
      isSupercollective: DataTypes.BOOLEAN,
      lastEditedByUserId: DataTypes.INTEGER,

      hid: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('GroupHistories');
  },
};
