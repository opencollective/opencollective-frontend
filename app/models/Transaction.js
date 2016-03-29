const _ = require('lodash');

/*
 * Transaction model
 * - this indicates that money was moved in the system
 */

module.exports = function(Sequelize, DataTypes) {

  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING, // Expense or Donation
    description: DataTypes.STRING, // delete #postmigration
    amount: DataTypes.FLOAT, // TODO: change to INTEGER
    vat: DataTypes.FLOAT, // delete #postmigration
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },
    vendor: DataTypes.STRING, // delete #postmigration
    paidby: DataTypes.STRING, // delete #postmigration
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.STRING, // delete #postmigration
    comment: DataTypes.STRING, // delete #postmigration
    link: DataTypes.STRING, // delete #postmigration

    payoutMethod: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['paypal', 'manual', 'other']],
          msg: 'Must be paypal, manual or other'
        }
      }
    }, // delete #postmigration

    platformFee: DataTypes.INTEGER,
    hostFee: DataTypes.INTEGER,
    stripeFee: DataTypes.INTEGER,
    paypalFee: DataTypes.INTEGER,
    stripeSubscriptionId: DataTypes.STRING, // // delete #postmigration

    interval: {
      type: DataTypes.STRING
    }, // delete #postmigration

    data: DataTypes.JSON,

    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }, // delete #postmigration

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    },

    approvedAt: DataTypes.DATE, // delete #postmigration
    reimbursedAt: DataTypes.DATE // delete #postmigration
  }, {
    paranoid: true,

    getterMethods: {

      preview() {
        if (!this.link) return {};

        if (this.link.match(/\.pdf$/)) {
          return {
            src: 'https://opencollective.com/static/images/mime-pdf.png',
            width: '100px'
          };
        } else {
          return {
            src: `https://res.cloudinary.com/opencollective/image/fetch/w_640/${this.link}`,
            width: '100%'
          };
        }
      },

      isRejected() {
        return !!this.approvedAt && !this.approved;
      },

      isDonation() {
        return _.contains(this.tags, 'Donation');
      },

      isExpense() {
        return this.amount < 0;
      },

      isManual() {
        return this.payoutMethod === 'manual';
      },

      isReimbursed() {
        return !!this.reimbursedAt;
      },

      // Info.
      info() {
        return {
          id: this.id,
          type: this.type,
          description: this.description,
          amount: this.amount,
          vat: this.vat,
          currency: this.currency,
          vendor: this.vendor,
          paidby: this.paidby,
          tags: this.tags,
          status: this.status,
          comment: this.comment,
          link: this.link,
          approved: this.approved,
          createdAt: this.createdAt,
          approvedAt: this.approvedAt,
          reimbursedAt: this.reimbursedAt,
          UserId: this.UserId,
          GroupId: this.GroupId,
          payoutMethod: this.payoutMethod,
          isExpense: this.isExpense,
          isRejected: this.isRejected,
          isDonation: this.isDonation,
          isManual: this.isManual,
          isReimbursed: this.isReimbursed,
          interval: this.interval,
          platformFee: this.platformFee,
          hostFee: this.hostFee,
          stripeFee: this.stripeFee,
          paypalFee: this.paypalFee
        };
      }
    }
  });

  return Transaction;
};