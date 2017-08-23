import * as stripe from '../gateways/stripe';

export default function(Sequelize, DataTypes) {
  
  const payoutMethods = ['paypal', 'stripe'];
  
  const PaymentMethod = Sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    identifier: DataTypes.STRING,
    primary: DataTypes.BOOLEAN,

    brand: {
      type: DataTypes.STRING,
      set(val) {
        if (val && val.toLowerCase) {
          this.setDataValue('brand', val.toLowerCase());
        }
      }
    },

    // Monthly limit in cents for each member of this.CollectiveId (in the currency of that collective)
    monthlyLimitPerMember: {
      type: DataTypes.INTEGER
    },

    expMonth: {
      type: DataTypes.INTEGER,
      set(val) {
        this.expiryDate = this.expiryDate || new Date;
        this.expiryDate.setMonth(val - 1);
        this.setDataValue('expMonth', Number(val));
      },
      validate: {
        'len': [1,2]
      }
    },

    expYear: {
      type: DataTypes.INTEGER,
      set(val) {
        this.expiryDate = this.expiryDate || new Date;
        this.expiryDate.setYear(val);
        this.setDataValue('expYear', Number(val));
      },
      validate: {
        'len': [4, 4]
      }
    },

    funding: DataTypes.STRING,
    country: DataTypes.STRING,
    fullName: DataTypes.STRING,
    token: DataTypes.STRING,
    customerId: DataTypes.STRING, // stores the id of the customer from the payment processor

    service: {
      type: DataTypes.STRING,
      defaultValue: 'stripe',
      validate: {
        isIn: {
          args: [payoutMethods],
          msg: `Must be in ${payoutMethods}`
        }
      }
    },

    data: DataTypes.JSON,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    confirmedAt: {
      type: DataTypes.DATE
    },

    archivedAt: {
      type: DataTypes.DATE
    },

    expiryDate: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {
      // Info.
      info() {
        return {
          id: this.id,
          uuid: this.uuid,
          token: this.token,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt,
          expMonth: this.expMonth,
          expYear: this.expYear,
          identifier: this.identifier,
          funding: this.funding,
          brand: this.brand,
          fullName: this.fullName,
          country: this.country
        };
      },

      minimal() {
        return {
          id: this.id,
          CreatedByUserId: this.CreatedByUserId,
          CollectiveId: this.CollectiveId,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt,
          expiryDate: this.expiryDate
        };
      }
    },

    classMethods: {
      createFromStripeSourceToken(PaymentMethodData) {
        return stripe.createCustomer(null, PaymentMethodData.token)
          .then(customer => {
            PaymentMethodData.customerId = customer.id;
            PaymentMethodData.primary = true;
            return this.create(PaymentMethodData);
          });
      }
    }
  });
  
  PaymentMethod.payoutMethods = payoutMethods;

  return PaymentMethod;
}
