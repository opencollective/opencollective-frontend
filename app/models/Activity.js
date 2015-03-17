module.exports = function(sequelize, DataTypes) {
  
  var Activity = sequelize.define('Activity', {
    type: DataTypes.STRING
  });

  return Activity;
};
