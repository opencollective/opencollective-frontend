module.exports = function(sequelize, DataTypes) {
  
  var Association = sequelize.define('Association', {
    name: DataTypes.STRING
  });

  return Association;
};
