module.exports = function(Sequelize, DataTypes) {
  
  var Activity = Sequelize.define('Activity', {
    type: DataTypes.STRING,
    target: DataTypes.STRING,
    data: DataTypes.JSON,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Activity;
};
