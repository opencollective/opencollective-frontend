module.exports = function(Sequelize, DataTypes) {
  
  var Group = Sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.STRING,

    membership_type: DataTypes.ENUM('donation', 'monthlyfee', 'yearlyfee'),
    membershipfee: DataTypes.FLOAT,

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
            id: this.id
          , name: this.name
          , description: this.description
          , membership_type: this.membership_type
          , membershipfee: this.membershipfee
          , createdAt: this.createdAt
          , updatedAt: this.updatedAt
        };
      },
    }
  });

  return Group;
};
