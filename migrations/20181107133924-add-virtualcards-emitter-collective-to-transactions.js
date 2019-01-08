'use strict';
import models from '../server/models';
import roles from '../server/constants/roles';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Transactions', 'UsingVirtualCardFromCollectiveId', {
        type: Sequelize.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description: 'References the collective that created the virtual card used for this order',
      })
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE  "Transactions" t
          SET     "UsingVirtualCardFromCollectiveId" = spm."CollectiveId"
          FROM    "PaymentMethods" pm, "PaymentMethods" spm
          WHERE   pm.id 	= t."PaymentMethodId"
          AND     spm.id 	= pm."SourcePaymentMethodId"
          AND     pm.type = 'virtualcard'
        `);
      })
      .then(async () => {
        // Fetch all transactions made using a virtual card
        const transactions = await models.Transaction.findAll({
          attributes: ['CollectiveId', 'FromCollectiveId', 'UsingVirtualCardFromCollectiveId', 'CreatedByUserId'],
          include: [
            {
              model: models.Collective,
              as: 'collective',
              attributes: ['id', 'type', 'slug', 'ParentCollectiveId'],
            },
            {
              model: models.Order,
              attributes: ['TierId'],
            },
          ],
          where: {
            UsingVirtualCardFromCollectiveId: { [Sequelize.Op.ne]: null },
          },
        });

        // Use the new field to populate Members for organizations<>collectives
        // Note that we won't be able to rollback these changes as we may
        // delete legit member organizations by doing so.
        transactions.map(t => {
          // If using a virtual card, we should also credit the organization that
          // emitted the virtual card as a backer
          t.collective.findOrAddUserWithRole(
            {
              id: t.CreatedByUserId,
              CollectiveId: t.UsingVirtualCardFromCollectiveId,
            },
            roles.BACKER,
            {
              CreatedByUserId: t.CreatedByUserId,
              TierId: t.Order.TierId,
            },
          );
        });
      });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('Transactions', 'UsingVirtualCardFromCollectiveId');
  },
};
