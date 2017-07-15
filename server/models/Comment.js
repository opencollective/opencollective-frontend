import Promise from 'bluebird';

export default function (Sequelize, DataTypes) {

  const Comment = Sequelize.define('Comment', {
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

    ExpenseId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Expenses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },    

    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    },

    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
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
          ExpenseId: this.ExpenseId,
          text: this.text,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          approvedAt: this.approvedAt
        }
      }
    },

    classMethods: {
      createMany: (comments, defaultValues = {}) => {
        return Promise.map(comments, c => Comment.create(Object.assign({}, c, defaultValues)), {concurrency: 1});
      }
    }
  });
  return Comment;
}