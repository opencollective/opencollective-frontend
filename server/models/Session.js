export default function(Sequelize, DataTypes) {
  const Session = Sequelize.define(
    'Session',
    {
      sid: {
        type: DataTypes.STRING(32),
        primaryKey: true,
      },

      expires: {
        type: DataTypes.DATE,
      },

      data: {
        type: DataTypes.TEXT,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      paranoid: true,
    },
  );

  return Session;
}
