const _ = require('lodash');

module.exports = function(Sequelize, DataTypes) {

  var Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    vat: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },
    vendor: DataTypes.STRING,
    paidby: DataTypes.STRING,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.STRING,
    comment: DataTypes.STRING,
    link: DataTypes.STRING,

    paymentMethod: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['paypal', 'manual']],
          msg: 'Must be paypal or manual'
        }
      }
    },

    interval: {
      type: DataTypes.STRING
    },

    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    approvedAt: DataTypes.DATE,
    reimbursedAt: DataTypes.DATE
  }, {
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
            src: 'https://res.cloudinary.com/opencollective/image/fetch/w_640/' + this.link,
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
        return this.paymentMethod === 'manual';
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
          paymentMethod: this.paymentMethod,
          isExpense: this.isExpense,
          isRejected: this.isRejected,
          isDonation: this.isDonation,
          isManual: this.isManual,
          isReimbursed: this.isReimbursed,
          interval: this.interval
        };
      }
    }
  });

  return Transaction;
};
