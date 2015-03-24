module.exports = function(Sequelize, DataTypes) {
  
  var UserGroup = Sequelize.define('UserGroup', {
    // Role.
    role: DataTypes.ENUM('admin', 'writer', 'viewer'),
    
    // Dates.
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    paranoid: true,
  });

  return UserGroup;
};
