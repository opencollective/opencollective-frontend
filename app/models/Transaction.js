module.exports = function(Sequelize, DataTypes) {

  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },
    beneficiary: DataTypes.STRING,
    paidby: DataTypes.STRING,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.STRING,
    comment: DataTypes.STRING,
    link: DataTypes.STRING,

    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: 'paypal',
      validate: {
        isIn: {
          args: [['paypal', 'manual']],
          msg: 'Must be paypal or manual'
        }
      }
    },

    stripeSubscriptionId: DataTypes.STRING,

    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    approvedAt: DataTypes.DATE,
    reimbursedAt: DataTypes.DATE
  }, {
    getterMethods: {
      // Info.
      info: function() {
        return {
          id: this.id,
          type: this.type,
          description: this.description,
          amount: this.amount,
          currency: this.currency,
          beneficiary: this.beneficiary,
          paidby: this.paidby,
          tags: this.tags,
          status: this.status,
          comment: this.comment,
          link: this.link,
          approved: this.approved,
          createdAt: this.createdAt,
          approvedAt: this.approvedAt,
          reimbursedAt: this.reimbursedAt,
          UserId: this.UserId,
          GroupId: this.GroupId,
          paymentMethod: this.paymentMethod
        };
      }
    }
  });

  return Transaction;
};
