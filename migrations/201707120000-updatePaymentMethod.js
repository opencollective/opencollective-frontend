'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('PaymentMethods', 'brand', DataTypes.STRING)
      .then(() => queryInterface.addColumn('PaymentMethods', 'identifier', DataTypes.STRING))
      .then(() => queryInterface.addColumn('PaymentMethods', 'country', DataTypes.STRING(2)))
      .then(() => queryInterface.addColumn('PaymentMethods', 'funding', DataTypes.STRING))
      .then(() => queryInterface.addColumn('PaymentMethods', 'fullName', DataTypes.STRING))
      .then(() => queryInterface.addColumn('PaymentMethods', 'expMonth', DataTypes.INTEGER))
      .then(() => queryInterface.addColumn('PaymentMethods', 'expYear', DataTypes.INTEGER))
      .then(() => queryInterface.addColumn('Users', 'organization', DataTypes.STRING))
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.removeColumn('PaymentMethods', 'brand')
      .then(() => queryInterface.removeColumn('PaymentMethods', 'identifier'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'funding'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'country'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'fullName'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'expMonth'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'expYear'))
      .then(() => queryInterface.removeColumn('Users', 'organization'))
  }
};
