import crypto from 'crypto';
import { merge } from 'lodash';

export default function(Sequelize, DataTypes) {

  const Application = Sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    clientId: {
      type: DataTypes.STRING
    },
    clientSecret: {
      type: DataTypes.STRING
    },
    callbackUrl: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    },
  }, {
    paranoid: true,

    getterMethods: {
      info() {
        return {
          name: this.name,
          description: this.description,
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          callbackUrl: this.callbackUrl,
        };
      }
    },
  });

  Application.create = (props) => {
    props = merge(props, {
      clientId: crypto.randomBytes(20).toString('hex'),
      clientSecret: crypto.randomBytes(40).toString('hex'),
    });

    return Application.build(props).save();
  }

  return Application;
}
