module.exports = function(Sequelize, DataTypes) {

  const Application = Sequelize.define('Application', {
    api_key: DataTypes.STRING,
    name: DataTypes.STRING,
    href: DataTypes.STRING,
    description: DataTypes.STRING,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    _access: {
      type: DataTypes.FLOAT,
      defaultValue: 0 // 1: all access, 0.5: can create users
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
      findByKey(key, cb) {
        Application.findOne({
          where: {
            api_key: key
          }
        })
        .then((application) => cb(null, application))
        .catch(cb);
      }
    },

    getterMethods: {
      // Info.
      info() {
        return {
          id: this.id,
          name: this.name,
          description: this.description,
          href: this.href,
          disabled: this.disabled,
          _access: this._access,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      }

    }
  });

  return Application;
};
