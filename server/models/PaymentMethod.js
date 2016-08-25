export default function(Sequelize, DataTypes) {
  
  const payoutMethods = ['paypal', 'stripe'];
  
  const PaymentMethod = Sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    number: DataTypes.STRING, // Delete #postmigration
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
          token: this.token,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt
        };
      }
    },

    classMethods: {
      // Note we can't use findOrCreate() method in Sequelize because of
      // https://github.com/sequelize/sequelize/issues/4631
      getOrCreate: params => {
        const attrs = {
          token: params.token,
          service: params.service,
          UserId: params.UserId
        };
      
        return PaymentMethod.findOne({ where: attrs })
          .then(paymentMethod => paymentMethod || PaymentMethod.create(attrs));
      }
    }
  });
  
  PaymentMethod.payoutMethods = payoutMethods;

  return PaymentMethod;
};
