import { Model, Transaction } from 'sequelize';
import { pick, get } from 'lodash';
import { isEmail } from 'validator';
import restoreSequelizeAttributesOnClass from '../lib/restore-sequelize-attributes-on-class';
import { objHasOnlyKeys } from '../lib/utils';

/**
 * Match the Postgres enum defined for `PayoutMethods` > `type`
 */
export enum PayoutMethodTypes {
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER',
}

/** An interface for the values stored in `data` field for PayPal payout methods */
export interface PaypalPayoutMethodData {
  email: string;
}

/** An interface for the values stored in `data` field for Custom payout methods */
export interface OtherPayoutMethodData {
  content: string;
}

/** Group all the possible types for payout method's data */
export type PayoutMethodDataType = PaypalPayoutMethodData | OtherPayoutMethodData | object;

/**
 * Sequelize model to represent an PayoutMethod, linked to the `PayoutMethods` table.
 */
export class PayoutMethod extends Model<PayoutMethod> {
  public readonly id!: number;
  public type!: PayoutMethodTypes;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt: Date;
  public name: string;
  public isSaved: boolean;
  public CollectiveId!: number;
  public CreatedByUserId!: number;

  private static editableFields = ['data', 'name', 'isSaved'];

  constructor(...args) {
    super(...args);
    restoreSequelizeAttributesOnClass(new.target, this);
  }

  /** A whitelist filter on `data` field. The returned object is safe to send to allowed users. */
  get data(): PayoutMethodDataType {
    switch (this.type) {
      case PayoutMethodTypes.PAYPAL:
        return { email: this.data['email'] } as PaypalPayoutMethodData;
      case PayoutMethodTypes.OTHER:
        return { content: this.data['content'] } as OtherPayoutMethodData;
      default:
        return {};
    }
  }

  /** Returns the raw data for this field. Includes sensitive information that should not be leaked to the user */
  get unfilteredData(): PayoutMethodDataType {
    return this.getDataValue('data');
  }

  /**
   * Create a payout method from user-submitted data.
   * @param payoutMethodData: The (potentially unsafe) user data. Fields will be whitelisted.
   * @param user: User creating this payout method
   */
  static async createFromData(
    payoutMethodData: object,
    user,
    collective,
    dbTransaction: Transaction | null,
  ): Promise<PayoutMethod> {
    const cleanData = PayoutMethod.cleanData(payoutMethodData);
    return PayoutMethod.create(
      { ...cleanData, type: payoutMethodData['type'], CreatedByUserId: user.id, CollectiveId: collective.id },
      { transaction: dbTransaction },
    );
  }

  /**
   * Get or create a payout method from data.
   * @param payoutMethodData: The (potentially unsafe) user data. Fields will be whitelisted.
   * @param user: User creating this
   */
  static async getOrCreateFromData(
    payoutMethodData,
    user,
    collective,
    dbTransaction: Transaction | null,
  ): Promise<PayoutMethod> {
    // We try to load the existing payment method if it exists for this collective
    let existingPm = null;
    if (payoutMethodData['type'] === PayoutMethodTypes.PAYPAL) {
      const email = get(payoutMethodData, 'data.email');
      if (email && isEmail(email)) {
        existingPm = await PayoutMethod.scope('paypal').findOne({
          where: {
            CollectiveId: collective.id,
            data: { email },
          },
        });
      }
    }

    // Otherwise we just call createFromData
    return existingPm || this.createFromData(payoutMethodData, user, collective, dbTransaction);
  }

  /**
   * Updates a payout method from user-submitted data.
   * @param payoutMethodData: The (potentially unsafe) user data. Fields will be whitelisted.
   */
  static async updateFromData(payoutMethodData: object, dbTransaction: Transaction | null): Promise<PayoutMethod> {
    const id = payoutMethodData['id'];
    const cleanData = PayoutMethod.cleanData(payoutMethodData);
    return PayoutMethod.update(cleanData, { where: { id }, transaction: dbTransaction });
  }

  /** Filters out all the fields that cannot be edited by user */
  private static cleanData(data: object): object {
    return pick(data, PayoutMethod.editableFields);
  }
}

export default (sequelize, DataTypes): typeof PayoutMethod => {
  // Link the model to database fields
  PayoutMethod.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        // Enum entries must match `PayoutMethodType`
        type: DataTypes.ENUM('PAYPAL', 'OTHER'),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(PayoutMethodTypes)],
            msg: `Must be one of ${Object.values(PayoutMethodTypes)}`,
          },
        },
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
          isValidValue(value): void {
            if (this.type === PayoutMethodTypes.PAYPAL) {
              if (!value || !value.email || !isEmail(value.email)) {
                throw new Error('Invalid PayPal email address');
              } else if (!objHasOnlyKeys(value, ['email'])) {
                throw new Error('Data for this payout method contains too much information');
              }
            } else if (this.type === PayoutMethodTypes.OTHER) {
              if (!value || !value.content || typeof value.content !== 'string') {
                throw new Error('Invalid format of custom payout method');
              } else if (!objHasOnlyKeys(value, ['content'])) {
                throw new Error('Data for this payout method contains too much information');
              }
            } else if (!value || Object.keys(value).length > 0) {
              throw new Error('Data for this payout method is not properly formatted');
            }
          },
        },
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
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },
      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true,
      tableName: 'PayoutMethods',
      scopes: {
        saved: {
          where: { isSaved: true },
        },
        paypal: {
          where: { type: PayoutMethodTypes.PAYPAL },
        },
      },
    },
  );

  return PayoutMethod;
};
