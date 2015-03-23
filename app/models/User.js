/**
 * Dependencies.
 */
var bcrypt = require('bcrypt')
  ;

/**
 * Constants.
 */
var SALT_WORK_FACTOR = 10;

/**
 * Model.
 */
module.exports = function(Sequelize, DataTypes) {
  
  var User = Sequelize.define('User', {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,


    username: {
      type: DataTypes.STRING,
      unique: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // need that? http://stackoverflow.com/questions/16356856/sequelize-js-custom-validator-check-for-unique-username-password
      validate: {
        len: {
          args: [6, 128],
          msg: "Email must be between 6 and 128 characters in length"
        },
        isEmail: {
          msg: "Email must be valid"
        }
      }
    },

    _salt: {
      type: DataTypes.STRING,
      defaultValue: bcrypt.genSaltSync(SALT_WORK_FACTOR)
    },
    password_hash: DataTypes.STRING,
    password: {
      type: DataTypes.VIRTUAL,
      set: function (val) {
        this.setDataValue('password', val);
        this.setDataValue('password_hash', bcrypt.hashSync(val, this._salt));
       },
       validate: {
        len: {
          args: [6, 128],
          msg: 'Password must be between 6 and 128 characters in length'
        }
      }
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
    paranoid: true,
    getterMethods: {
      info: function() {
        var info = {
          first_name: this.first_name,
          last_name: this.last_name,
          email: this.email,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
        return info;
      }
    }
  });

  return User;
};
