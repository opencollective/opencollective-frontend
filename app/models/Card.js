module.exports = function(sequelize, DataTypes) {
  
  var Card = sequelize.define('Card', {
    number: DataTypes.STRING
  });

  return Card;
};
