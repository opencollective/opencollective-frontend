
module.exports = function(Sequelize, DataTypes) {
  
  var Subscription = require('./Subscription')(Sequelize, DataTypes);
  
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

    getterMethods: {
      // Info.
      info: function() {
        return {
          role: this.role,
          GroupId: this.GroupId,
          UserId: this.UserId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          deletedAt: this.deletedAt
        };
      }
    }
    
  });

  return UserGroup;
};
