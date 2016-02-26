module.exports = (Sequelize, DataTypes) => {

  const Subscription = Sequelize.define('Subscription', {

    amount: {
      type: DataTypes.FLOAT,
      validate: { min: 0 }
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    interval: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['month', 'year']],
          msg: 'Must be month or year'
        }
      }
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    data: DataTypes.JSON,

    stripeSubscriptionId: DataTypes.STRING,

    activatedAt: DataTypes.DATE,

    deactivatedAt: DataTypes.DATE
  });

  return Subscription;
};


