export default (Sequelize, DataTypes) => {

  const Subscription = Sequelize.define('Subscription', {

    amount: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.STRING(8),
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
  }, {
    paranoid: true,

    instanceMethods: {
      activate() {
        this.isActive = true;
        this.activatedAt = new Date();

        return this.save();
      },
      deactivate() {
        this.isActive = false;
        this.deactivatedAt = new Date();

        return this.save();
      }
    }
  });

  return Subscription;
};


