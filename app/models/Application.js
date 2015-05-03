module.exports = function(Sequelize, DataTypes) {

  var Application = Sequelize.define('Application', {
    api_key: DataTypes.STRING,
    name: DataTypes.STRING,
    href: DataTypes.STRING,
    description: DataTypes.STRING,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
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
  }, {
    classMethods: {
      findByKey: function(key, fn) {
        Application
          .findOne({where: {
            api_key: key
          }})
          .then(function(application) {
            return fn(null, application);
          })
          .catch(fn);
      }
    },
  });

  return Application;
};
