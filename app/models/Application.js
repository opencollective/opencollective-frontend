module.exports = function(Sequelize, DataTypes) {

  var Application = Sequelize.define('Card', {
    api_key: DataTypes.STRING,
    name: DataTypes.STRING,
    href: DataTypes.STRING,
    description: DataTypes.STRING,
    disabled: DataTypes.BOOLEAN,
    _access: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Application;
};
