import Promise from 'bluebird';
import status from '../constants/response_status';
import _ from 'lodash';

export default function(Sequelize, DataTypes) {

  const Response = Sequelize.define('Response', {
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
      onUpdate: 'CASCADE',
      allowNull: false
    },

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    TierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tiers',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },

    EventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Events',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },

    confirmedAt: {
      type: DataTypes.DATE
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: status.PENDING,
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.keys(status)],
          msg: `Must be in ${Object.keys(status)}`
        }
      }
    },

    quantity: {
      type: DataTypes.INTEGER,
      min: 0
    },

    description: {
      type: DataTypes.STRING,
    },
    
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {
      info() {
        return {
          id: this.id,
          UserId: this.UserId,
          CollectiveId: this.CollectiveId,
          EventId: this.EventId,
          TierId: this.TierId,
          quantity: this.quantity,
          description: this.description,
          status: this.status,
          confirmedAt: this.confirmedAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    },

    instanceMethods: {
      getUserForViewer(viewer) {
        const promises = [this.getUser()];
        if (viewer) {
          promises.push(viewer.canEditCollective(this.CollectiveId));
        }
        return Promise.all(promises)
        .then(results => {
          const user = results[0];
          const canEditCollective = results[1];
          return canEditCollective ? user.info : user.public;
        })
      }
    },
    classMethods: {
      createMany: (responses, defaultValues = {}) => {
        return Promise.map(responses, r => Response.create(_.defaults({}, r, defaultValues)), {concurrency: 1});
      }
    }
  });

  return Response;
}