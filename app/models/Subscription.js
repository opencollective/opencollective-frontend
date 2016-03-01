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

    // The subscription.plan.amount is not on the same scale as our amount. Stripe
    // show 10$ as 1000 USD. In our db we save 10$ as 10 USD.
    data: DataTypes.JSON,

    stripeSubscriptionId: DataTypes.STRING,

    activatedAt: DataTypes.DATE,

    deactivatedAt: DataTypes.DATE
  });

  return Subscription;
};


