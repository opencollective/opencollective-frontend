export default function(Sequelize, DataTypes) {
  const US_TAX_FORM = 'US_TAX_FORM';

  const RequiredLegalDocument = Sequelize.define('RequiredLegalDocument', {
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

  RequiredLegalDocument.documentType = {};
  RequiredLegalDocument.documentType.US_TAX_FORM = US_TAX_FORM;

  RequiredLegalDocument.associate = m => {
    RequiredLegalDocument.belongsTo(m.Collective, {
      foreignKey: 'HostCollectiveId',
      as: 'hostCollective',
    });
  };

  return RequiredLegalDocument;
}
