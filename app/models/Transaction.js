module.exports = function(Sequelize, DataTypes) {

  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    beneficiary: DataTypes.STRING,
    paidby: DataTypes.STRING,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.STRING,
    comment: DataTypes.STRING,
    link: DataTypes.STRING,

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
  });

  return Transaction;
};
