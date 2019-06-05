export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const NOT_REQUESTED = 'NOT_REQUESTED';
  const REQUESTED = 'REQUESTED';
  const RECEIVED = 'RECEIVED';
  const ERROR = 'ERROR';
  const US_TAX_FORM = 'US_TAX_FORM';

  const LegalDocument = Sequelize.define('LegalDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    year: {
      type: DataTypes.INTEGER,
      validate: {
        min: 2015,
        notNull: true,
      },
      allowNull: false,
    },
    document_link: {
      type: DataTypes.STRING,
    },
    request_status: {
      type: DataTypes.ENUM,
      values: [NOT_REQUESTED, REQUESTED, RECEIVED, ERROR],
      allowNull: false,
      defaultValue: NOT_REQUESTED,
    },
    document_type: {
      type: DataTypes.ENUM,
      values: [US_TAX_FORM],
      allowNull: false,
      defaultValue: US_TAX_FORM,
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

  LegalDocument.request_status = {};
  LegalDocument.request_status.REQUESTED = REQUESTED;
  LegalDocument.request_status.NOT_REQUESTED = NOT_REQUESTED;
  LegalDocument.request_status.RECEIVED = RECEIVED;
  LegalDocument.request_status.ERROR = ERROR;
  LegalDocument.document_type = {};
  LegalDocument.document_type.US_TAX_FORM = US_TAX_FORM;

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
