import roles from '../constants/roles';

export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Member= Sequelize.define('Member', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    TierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tiers',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member',
      validate: {
        isIn: {
          args: [[roles.HOST, roles.ADMIN, roles.BACKER, roles.CONTRIBUTOR, roles.FOLLOWER]],
          msg: 'Must be host, admin, backer, contributor or follower'
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
          fields: ['UserId', 'CollectiveId', 'role'],
          name: 'UserId-CollectiveId-role',
          constraints: true
      }
    ],
    instanceMethods: {
      getUserForViewer(viewer, userid = this.UserId) {
        const promises = [models.User.findOne({where: { id: userid }})];
        if (viewer) {
          promises.push(viewer.canEditCollective(this.CollectiveId));
        }
        return Promise.all(promises)
        .then(results => {
          const user = results[0];
          if (!user) return {}; // need to return an object other it breaks when graphql tries user.name
          const canEditCollective = results[1];
          return canEditCollective ? user.info : user.public;
        })
      }
    },
    getterMethods: {
      // Info.
      info() {
        return {
          role: this.role,
          CollectiveId: this.CollectiveId,
          UserId: this.UserId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          deletedAt: this.deletedAt
        };
      }
    }
  });

  return Member
}
