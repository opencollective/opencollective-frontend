export default function(Sequelize, DataTypes) {
  const NOT_REQUESTED = 'NOT_REQUESTED';
  const REQUESTED = 'REQUESTED';
  const RECEIVED = 'RECEIVED';
  const ERROR = 'ERROR';

  const LegalDocument = Sequelize.define(
    'LegalDocument',
    {
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
      RequiredLegalDocumentTypeId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'RequiredLegalDocumentTypes',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
    },
    {
      paranoid: true,
    },
  );

  LegalDocument.findByTypeYearUser = ({ documentType, year, user }) => {
    return LegalDocument.findOne({
      where: {
        year,
        CollectiveId: user.collective.id,
      },
      include: [
        {
          association: 'requiredLegalDocumentType',
          where: {
            documentType,
          },
        },
      ],
    });
  };

  LegalDocument.doesUserNeedToBeSentDocument = async ({ documentType, year, user }) => {
    const doc = await LegalDocument.findByTypeYearUser({ documentType, year, user });

    return doc == null || doc.requestStatus == NOT_REQUESTED || doc.requestStatus == ERROR;
  };

  LegalDocument.requestStatus = {
    REQUESTED,
    NOT_REQUESTED,
    RECEIVED,
    ERROR,
  };

  LegalDocument.associate = m => {
    LegalDocument.belongsTo(m.Collective, {
      foreignKey: 'CollectiveId',
      as: 'collective',
    });
    LegalDocument.belongsTo(m.RequiredLegalDocumentType, {
      foreignKey: 'RequiredLegalDocumentTypeId',
      as: 'requiredLegalDocumentType',
    });
  };

  return LegalDocument;
}
