module.exports = function(Sequelize, DataTypes) {

  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    currency: DataTypes.STRING,
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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Transaction;
};
