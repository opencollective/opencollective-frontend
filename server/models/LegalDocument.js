export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const NOT_REQUESTED = 'NOT_REQUESTED';
  const REQUESTED = 'REQUESTED';
  const RECEIVED = 'RECEIVED';
  const ERROR = 'ERROR';

  const LegalDocument = Sequelize.define('LegalDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    year: {
      type: DataTypes.STRING,
    },
    document_link: {
      type: DataTypes.STRING,
    },
    request_status: {
      type: DataTypes.ENUM,
      values: [NOT_REQUESTED, REQUESTED, RECEIVED, ERROR],
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },

    deletedAt: {
      type: DataTypes.DATE,
    },
    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false,
    },
    HostCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false,
    },
  });

  LegalDocument.REQUESTED = REQUESTED;
  LegalDocument.NOT_REQUESTED = NOT_REQUESTED;
  LegalDocument.RECEIVED = RECEIVED;
  LegalDocument.ERROR = ERROR;

  LegalDocument.prototype.setNewDocumentState = async function(newState) {};

  LegalDocument.associate = m => {
    LegalDocument.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    LegalDocument.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'hostCollective',
    });
  };

  return LegalDocument;
}
