module.exports = function(Sequelize, DataTypes) {
  
  var UserGroup = Sequelize.define('UserGroup', {
    role: DataTypes.STRING,
    status: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return UserGroup;
};
