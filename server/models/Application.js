import crypto from 'crypto';
import { merge } from 'lodash';

export default function(Sequelize, DataTypes) {
  const Application = Sequelize.define(
    'Application',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM,
        values: ['apiKey', 'oAuth'],
      },
      apiKey: {
        type: DataTypes.STRING,
      },
      clientId: {
        type: DataTypes.STRING,
      },
      clientSecret: {
        type: DataTypes.STRING,
      },
      callbackUrl: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.STRING,
      },
      disabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        info() {
          return {
            name: this.name,
            description: this.description,
            apiKey: this.apiKey,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            callbackUrl: this.callbackUrl,
          };
        },
      },
    },
  );

  Application.create = props => {
    if (props.type === 'apiKey') {
      props = merge(props, {
        apiKey: crypto.randomBytes(20).toString('hex'),
      });
    }
    if (props.type === 'oAuth') {
      props = merge(props, {
        clientId: crypto.randomBytes(20).toString('hex'),
        clientSecret: crypto.randomBytes(40).toString('hex'),
      });
    }
    return Application.build(props).save();
  };

  return Application;
}
