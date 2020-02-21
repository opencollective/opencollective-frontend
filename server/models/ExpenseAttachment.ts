import { Model, Transaction } from 'sequelize';
import { pick } from 'lodash';
import restoreSequelizeAttributesOnClass from '../lib/restore-sequelize-attributes-on-class';
import { diffDBEntries } from '../lib/data';

/**
 * Sequelize model to represent an ExpenseAttachment, linked to the `ExpenseAttachments` table.
 */
export class ExpenseAttachment extends Model<ExpenseAttachment> {
  public readonly id!: number;
  public ExpenseId!: number;
  public CreatedByUserId!: number;
  public amount!: number;
  public url!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt: Date;
  public incurredAt!: Date;
  public description: string;

  private static editableFields = ['amount', 'url', 'description', 'incurredAt'];

  constructor(...args) {
    super(...args);
    restoreSequelizeAttributesOnClass(new.target, this);
  }

  /**
   * Based on `diffDBEntries`, diff two attachments list to know which ones where
   * added, removed or added.
   * @returns [newEntries, removedEntries, updatedEntries]
   */
  static diffDBEntries = (baseAttachments, attachmentsData): [object[], ExpenseAttachment[], object[]] => {
    return diffDBEntries(baseAttachments, attachmentsData, ExpenseAttachment.editableFields);
  };

  /**
   * Create an attachment from user-submitted data.
   * @param attachmentData: The (potentially unsafe) user data. Fields will be whitelisted.
   * @param user: User creating this attachment
   * @param expense: The linked expense
   */
  static async createFromData(
    attachmentData: object,
    user,
    expense,
    dbTransaction: Transaction | null,
  ): Promise<ExpenseAttachment> {
    const cleanData = ExpenseAttachment.cleanData(attachmentData);
    return ExpenseAttachment.create(
      { ...cleanData, ExpenseId: expense.id, CreatedByUserId: user.id },
      { transaction: dbTransaction },
    );
  }

  /**
   * Updates an attachment from user-submitted data.
   * @param attachmentData: The (potentially unsafe) user data. Fields will be whitelisted.
   */
  static async updateFromData(attachmentData: object, dbTransaction: Transaction | null): Promise<ExpenseAttachment> {
    const id = attachmentData['id'];
    const cleanData = ExpenseAttachment.cleanData(attachmentData);
    return ExpenseAttachment.update(cleanData, { where: { id }, transaction: dbTransaction });
  }

  /** Filters out all the fields that cannot be edited by user */
  private static cleanData(data: object): object {
    return pick(data, ExpenseAttachment.editableFields);
  }
}

export default (sequelize, DataTypes): typeof ExpenseAttachment => {
  // Link the model to database fields
  ExpenseAttachment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value: string | null): void {
          // Make sure empty strings are converted to null
          this.setDataValue('url', value || null);
        },
        validate: {
          isUrl: true,
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
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
      deletedAt: {
        type: DataTypes.DATE,
      },
      incurredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      ExpenseId: {
        type: DataTypes.INTEGER,
        references: { model: 'Expenses', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
    },
    {
      sequelize,
      paranoid: true,
      tableName: 'ExpenseAttachments',
    },
  );

  return ExpenseAttachment;
};
