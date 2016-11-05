module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Comments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      text: {
        type: DataTypes.TEXT
      },
      // Dates.
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      deletedAt: {
        type: DataTypes.DATE
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: 'Users',
        referencesKey: 'id',
        primaryKey: true,
        allowNull: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referencesKey: 'id',
        primaryKey: true,
        allowNull: false
      },
      ExpenseId: {
        type: DataTypes.INTEGER,
        references: 'Expenses',
        referencesKey: 'id',
        primaryKey: true,
        allowNull: true
      },
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Comments');
  }
};