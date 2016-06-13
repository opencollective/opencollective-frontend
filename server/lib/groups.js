module.exports = app => {

  const models = app.set('models');
  const sequelize = models.sequelize;

  function getBalance(groupId) {
    return models.Transaction
      .find({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('netAmountInGroupCurrency')), 'total']
        ],
        where: {
          GroupId: groupId
          }
        })
      .then(result => result.toJSON().total);
  }

  return {
    getBalance
  };
};
