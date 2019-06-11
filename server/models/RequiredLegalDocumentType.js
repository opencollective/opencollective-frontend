export default function(Sequelize, DataTypes) {
  const US_TAX_FORM = 'US_TAX_FORM';

  const RequiredLegalDocumentType = Sequelize.define('RequiredLegalDocumentType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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

  RequiredLegalDocumentType.documentType = {};
  RequiredLegalDocumentType.documentType.US_TAX_FORM = US_TAX_FORM;

  RequiredLegalDocumentType.associate = m => {
    RequiredLegalDocumentType.belongsTo(m.Collective, {
      foreignKey: 'HostCollectiveId',
      as: 'hostCollective',
    });
  };

  return RequiredLegalDocumentType;
}
