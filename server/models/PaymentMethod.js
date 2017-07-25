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
    identifier: DataTypes.STRING,

    brand: {
      type: DataTypes.STRING,
      set(val) {
        if (val && val.toLowerCase) {
          this.setDataValue('brand', val.toLowerCase());
        }
      }
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
    expiryDate: {
      type: DataTypes.DATE
    },
    confirmedAt: {
      type: DataTypes.DATE
    },
    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
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
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt,
          expiryDate: this.expiryDate
        };
      }
    }
  });
  
  PaymentMethod.payoutMethods = payoutMethods;

  return PaymentMethod;
}
