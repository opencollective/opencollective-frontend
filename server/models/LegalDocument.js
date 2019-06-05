export default function(Sequelize, DataTypes) {
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
    documentLink: {
      type: DataTypes.STRING,
      field: 'document_link',
    },
    requestStatus: {
      type: DataTypes.ENUM,
      values: [NOT_REQUESTED, REQUESTED, RECEIVED, ERROR],
      allowNull: false,
      defaultValue: NOT_REQUESTED,
      field: 'request_status',
    },
    documentType: {
      type: DataTypes.ENUM,
      values: [US_TAX_FORM],
      allowNull: false,
      defaultValue: US_TAX_FORM,
      field: 'document_type',
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

  LegalDocument.requestStatus = {};
  LegalDocument.requestStatus.REQUESTED = REQUESTED;
  LegalDocument.requestStatus.NOT_REQUESTED = NOT_REQUESTED;
  LegalDocument.requestStatus.RECEIVED = RECEIVED;
  LegalDocument.requestStatus.ERROR = ERROR;
  LegalDocument.documentType = {};
  LegalDocument.documentType.US_TAX_FORM = US_TAX_FORM;

  LegalDocument.associate = m => {
    LegalDocument.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    LegalDocument.belongsTo(m.Collective, {
      foreignKey: 'HostCollectiveId',
      as: 'hostCollective',
    });
  };

  return LegalDocument;
}
