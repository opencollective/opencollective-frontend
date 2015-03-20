module.exports = function(Sequelize, DataTypes) {
  
  var Group = Sequelize.define('Group', {
    name: DataTypes.STRING,
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
  });

  return Group;
};
