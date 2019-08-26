export default function(Sequelize, DataTypes) {
  const NOT_REQUESTED = 'NOT_REQUESTED';
  const REQUESTED = 'REQUESTED';
  const RECEIVED = 'RECEIVED';
  const ERROR = 'ERROR';

  const US_TAX_FORM = 'US_TAX_FORM';

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
        unique: 'yearTypeCollective',
      },
      documentType: {
        type: DataTypes.ENUM,
        values: [US_TAX_FORM],
        allowNull: false,
        defaultValue: US_TAX_FORM,
        unique: 'yearTypeCollective',
      },
      documentLink: {
        type: DataTypes.STRING,
      },
      requestStatus: {
        type: DataTypes.ENUM,
        values: [NOT_REQUESTED, REQUESTED, RECEIVED, ERROR],
        allowNull: false,
        defaultValue: NOT_REQUESTED,
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
        unique: 'yearTypeCollective',
      },
    },
    {
      paranoid: true,
    },
  );

  LegalDocument.findByTypeYearUser = ({ documentType, year, user }) => {
    return user.getCollective().then(collective => {
      if (collective) {
        return LegalDocument.findOne({
          where: {
            year,
            CollectiveId: collective.id,
            documentType,
          },
        });
      }
    });
  };

  LegalDocument.hasUserCompletedDocument = async ({ documentType, year, user }) => {
    const doc = await LegalDocument.findByTypeYearUser({ documentType, year, user });

    return doc !== null && doc.requestStatus == RECEIVED;
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
  };

  return LegalDocument;
}
