module.exports = function(Sequelize, DataTypes) {
  
  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    currency: DataTypes.STRING,
    tags: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Transaction;
};
