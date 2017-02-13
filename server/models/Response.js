import status from '../constants/response_status';

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

    GroupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups',
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
      allowNull: false
    },

    EventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Events',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
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
          GroupId: this.GroupId,
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
    }
  });

  return Response;
}