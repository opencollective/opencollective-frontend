import roles from '../constants/roles';

export default function(Sequelize, DataTypes) {

  const UserGroup = Sequelize.define('UserGroup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Role.
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member',
      validate: {
        isIn: {
          args: [[roles.HOST, roles.MEMBER, roles.BACKER]],
          msg: 'Must be host, member or backer'
        }
      }
    },

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
    indexes: [
       {
          unique: true,
          fields: ['UserId', 'GroupId', 'role'],
          name: 'UserGroups_3way',
          constraints: true
      }
    ],

    getterMethods: {
      // Info.
      info() {
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
