module.exports = function(Sequelize, DataTypes) {

  var Donation = Sequelize.define('Donation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    UserId: {
      type: DataTypes.INTEGER,
      references: 'Users',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    GroupId: {
      type: DataTypes.INTEGER,
      references: 'Groups',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    // 3 letter international code (in uppercase) of the currency (e.g. USD, EUR, MXN, GBP, ...)
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    amount: DataTypes.INTEGER, // In cents
    amountFloat: { // remove #postmigration
      type: DataTypes.VIRTUAL,
      get: function () {
        return parseFloat(this.get('amount') / 100);
      }
    },

    title: DataTypes.STRING,

    SubscriptionId: {
      type: DataTypes.INTEGER,
      references: 'Subscriptions',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {
      info() {
        return {
          id: this.id,
          UserId: this.UserId,
          GroupId: this.GroupId,
          currency: this.currency,
          amount: this.amount,
          title: this.title,
          SubscriptionId: this.SubscriptionId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    }
  });

  return Donation;
}
