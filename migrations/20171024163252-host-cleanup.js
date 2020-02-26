'use strict';

const Promise = require('bluebird');
const { v4: uuidv4 } = require('uuid');

const DRY_RUN = false;

const insert = (sequelize, table, entry) => {
  delete entry.id;
  console.log(
    `INSERT INTO "${table}" ("${Object.keys(entry).join('","')}") VALUES (:${Object.values(entry).join(',:')})`,
  );
  if (entry.data) {
    entry.data = JSON.stringify(entry.data);
  }
  return sequelize.query(
    `
    INSERT INTO "${table}" ("${Object.keys(entry).join('","')}") VALUES (:${Object.keys(entry).join(',:')})
  `,
    { replacements: entry },
  );
};

/*
1. Find all supercollectives that are listed as hosts themselves
2. For each one, create a new org and make that the host
3. Update all collectives and subcollectives to reflect new host
4. Update all transactions to show the correct host
5. Update 3-transaction sets that are breaking double entry

*/
const findAndFixSuperCollectives = sequelize => {
  const createOrg = superCollective => {
    const orgSlug = `${superCollective.slug} Org`;

    const newOrg = Object.assign({}, superCollective, {
      name: `${superCollective.name} org`,
      slug: orgSlug,
      HostCollectiveId: null,
      ParentCollectiveId: null,
      type: 'ORGANIZATION',
      isSupercollective: false,
      settings: null,
      tags: null,
    });

    return insert(sequelize, 'Collectives', newOrg)
      .then(() =>
        sequelize.query(
          `
        SELECT * FROM "Collectives" 
        WHERE slug like :slug
        `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
              slug: orgSlug,
            },
          },
        ),
      )
      .then(orgCollectives => orgCollectives[0]);
  };

  const addAdmins = (superCollective, orgCollective) => {
    return sequelize
      .query(
        `
      SELECT * FROM "Members"
      WHERE 
        "CollectiveId" = :collectiveId AND
        (role LIKE 'ADMIN' OR role LIKE 'HOST')
        AND "deletedAt" IS NULL
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: {
            collectiveId: superCollective.id,
          },
        },
      )
      .then(members => {
        console.log('>>> Members found: ', members.length);
        return members;
      })
      .each(member => {
        // this check treats circular members where CollectiveId = MemberCollectiveId
        if (member.CollectiveId !== member.MemberCollectiveId) {
          const newMember = {
            CreatedByUserId: member.CreatedByUserId,
            CollectiveId: orgCollective.id,
            role: member.role,
            MemberCollectiveId: member.MemberCollectiveId,
          };
          return insert(sequelize, 'Members', newMember);
        } else {
          const newMember = {
            CreatedByUserId: member.CreatedByUserId,
            CollectiveId: member.CollectiveId,
            role: member.role,
            MemberCollectiveId: orgCollective.id,
          };
          return insert(sequelize, 'Members', newMember);
        }
      });
  };

  const makeOrgHost = (superCollective, orgCollective) => {
    return (
      sequelize
        .query(
          `
      UPDATE "Collectives" 
        SET "HostCollectiveId" = :orgCollectiveId
      WHERE "HostCollectiveId" = :superCollectiveId
      `,
          {
            replacements: {
              orgCollectiveId: orgCollective.id,
              superCollectiveId: superCollective.id,
            },
          },
        )
        // Also update the Members table
        .then(() =>
          sequelize.query(
            `
        UPDATE "Members"
          SET "MemberCollectiveId" = :orgCollectiveId
        WHERE "MemberCollectiveId" = :superCollectiveId
          AND (role LIKE 'HOST' or role LIKE 'ADMIN')
        `,
            {
              replacements: {
                orgCollectiveId: orgCollective.id,
                superCollectiveId: superCollective.id,
              },
            },
          ),
        )
    );
  };

  const moveStripeAccount = (superCollective, orgCollective) => {
    return sequelize.query(
      `
      UPDATE "ConnectedAccounts"
        SET "CollectiveId" = :orgCollectiveId
      WHERE "CollectiveId" = :superCollectiveId
        AND service LIKe 'stripe'
      `,
      {
        replacements: {
          orgCollectiveId: orgCollective.id,
          superCollectiveId: superCollective.id,
        },
      },
    );
  };

  const movePaypalAccount = (superCollective, orgCollective) => {
    return sequelize.query(
      `
      UPDATE "PaymentMethods"
        SET "CollectiveId" = :orgCollectiveId
      WHERE "CollectiveId" = :superCollectiveId
        AND service LIKE 'paypal'
      `,
      {
        replacements: {
          orgCollectiveId: orgCollective.id,
          superCollectiveId: superCollective.id,
        },
      },
    );
  };

  const fixTransactions = (superCollective, orgCollective) => {
    const splitTransactionGroup = transactions => {
      // Split the transactions group to identify each of the three transactions
      const withoutFromCollective = transactions.filter(t => !t.FromCollectiveId)[0];
      const debit = transactions.filter(t => t.type === 'DEBIT')[0];
      const credit = transactions.filter(t => t.type === 'CREDIT' && t.FromCollectiveId)[0];

      // check that each entry was filled
      if (!(withoutFromCollective && withoutFromCollective.id && debit && debit.id && credit && credit.id)) {
        throw new Error('TransactionGroup check failed');
      }

      // check that each id is different
      if (withoutFromCollective.id === debit.id || debit.id === credit.id || credit.id === withoutFromCollective.id) {
        throw new Error('TransactionGroup duplicate ids found');
      }

      return { withoutFromCollective, debit, credit };
    };

    // Change all HostCollectiveIds to orgCollective
    return (
      sequelize
        .query(
          `
      UPDATE "Transactions"
        SET "HostCollectiveId" = :orgCollectiveId
      WHERE "HostCollectiveId" = :superCollectiveId
      `,
          {
            replacements: {
              orgCollectiveId: orgCollective.id,
              superCollectiveId: superCollective.id,
            },
          },
        )

        // Fetch all transactionGroups that have 3 entries
        .then(() =>
          sequelize.query(
            `
        SELECT "TransactionGroup" FROM "Transactions"
        WHERE "TransactionGroup" IS NOT NULL AND 
          ("CollectiveId" = :superCollectiveId OR "FromCollectiveId" = :superCollectiveId)
        GROUP BY "TransactionGroup"
        HAVING COUNT(*) >= 3 
        `,
            {
              type: sequelize.QueryTypes.SELECT,
              replacements: {
                superCollectiveId: superCollective.id,
              },
            },
          ),
        )
        .then(transactionGroups => {
          console.log('>>> transaction groups found: ', transactionGroups.length);
          return transactionGroups;
        })
        .each(transactionGroup => {
          console.log('>>> Processing', transactionGroup);
          // fetch all transaction matching that transactionGroup
          return sequelize
            .query(
              `
          SELECT * FROM "Transactions" 
          WHERE "TransactionGroup" = :transactionGroup
          `,
              {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                  transactionGroup: transactionGroup.TransactionGroup, // data returned this way from query
                },
              },
            )
            .then(transactions => {
              /* For every 3 set of TransactionGroups, 
              1. remove transaction with no FromCollectiveId
              2. take the debit and change CollectiveId to orgCollectiveId
              3. take the credit and change FromCollectiveId to orgCollectiveId
            */
              if (transactions.length !== 3) {
                throw new Error('Found a transaction group of length', transactions.length);
              }

              const tSplit = splitTransactionGroup(transactions);

              // I'm sure there is a way to do this in one query...
              return sequelize
                .query(
                  `
              UPDATE "Transactions"
                SET "deletedAt" = :date
              WHERE id = :tId
              `,
                  {
                    replacements: {
                      date: new Date(),
                      tId: tSplit.withoutFromCollective.id,
                    },
                  },
                )
                .then(() =>
                  sequelize.query(
                    `
                UPDATE "Transactions"
                  SET "CollectiveId" = :orgCollectiveId
                WHERE id= :tId
                `,
                    {
                      replacements: {
                        orgCollectiveId: orgCollective.id,
                        tId: tSplit.debit.id,
                      },
                    },
                  ),
                )
                .then(() =>
                  sequelize.query(
                    `
                  UPDATE "Transactions"
                    SET "FromCollectiveId" = :orgCollectiveId
                  WHERE id= :tId
                  `,
                    {
                      replacements: {
                        orgCollectiveId: orgCollective.id,
                        tId: tSplit.credit.id,
                      },
                    },
                  ),
                );
            });
        })
    );
  };

  return (
    sequelize
      .query(
        `
    SELECT * from "Collectives"
    WHERE "isSupercollective" is true
    `,
        { type: sequelize.QueryTypes.SELECT },
      )
      .then(superCollectives => {
        console.log('>>> supercollectives found: ', superCollectives.length);
        return superCollectives;
      })
      // only return those that are using themselves as host
      .filter(superCollective => superCollective.HostCollectiveId === superCollective.id)
      .then(superCollectivesSubset => {
        console.log('>>> supercollectives need to be fixed: ', superCollectivesSubset.length);
        console.log(
          '>>> supercollectives slugs: ',
          superCollectivesSubset.map(c => c.slug),
        );
        return superCollectivesSubset;
      })
      .each(superCollective => {
        console.log('>>> Processing', superCollective.slug);
        let orgCollective;
        return createOrg(superCollective)
          .then(org => {
            orgCollective = org;
            return addAdmins(superCollective, orgCollective);
          })
          .then(() => makeOrgHost(superCollective, orgCollective))
          .then(() => moveStripeAccount(superCollective, orgCollective))
          .then(() => movePaypalAccount(superCollective, orgCollective))
          .then(() => fixTransactions(superCollective, orgCollective));
      })
  );
};

const fixHostCollectiveIds = sequelize => {
  // a host shouldn't be listed as it's own HostCollectiveId
  return (
    sequelize
      .query(
        `
    WITH hosts AS 
      (SELECT DISTINCT("HostCollectiveId") from "Collectives")

    UPDATE "Collectives" 
      SET "HostCollectiveId" = null
    WHERE 
      id IN (SELECT * FROM hosts);
    `,
      )

      // Remove HostCollectiveId from Events, only need ParentCollectiveId
      .then(() =>
        sequelize.query(`
    UPDATE "Collectives"
      SET "HostCollectiveId" = null
    WHERE
      type LIKE 'EVENT'
    `),
      )
  );
};

const fixParentCollectiveIds = sequelize => {
  // a host shouldn't be listed as it's own ParentCollectiveId either
  return sequelize.query(`
    WITH hosts AS 
      (SELECT DISTINCT("HostCollectiveId") from "Collectives")

    UPDATE "Collectives" 
      SET "ParentCollectiveId" = null
    WHERE 
      id IN (SELECT * FROM hosts);
    `);
};

const fixTripleEntryTransactions = sequelize => {
  // Whatever tripe entry transactions are now left, we can simply remove the
  // row that doesn't have `FromCollectiveId`

  console.log('>>> Fixing remaining triple entry transaction groups');
  return sequelize
    .query(
      `
    SELECT "TransactionGroup" FROM "Transactions"
    WHERE "TransactionGroup" IS NOT NULL and "deletedAt" IS NULL
    GROUP BY "TransactionGroup"
    HAVING COUNT(*) >= 3 
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(transactionGroups => {
      console.log('>>> transaction groups found: ', transactionGroups.length);
      return transactionGroups;
    })
    .each(transactionGroup => {
      console.log('>>> Processing', transactionGroup);
      // fetch all transaction matching that transactionGroup
      return sequelize
        .query(
          `
      SELECT * FROM "Transactions" 
      WHERE "TransactionGroup" = :transactionGroup
      `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
              transactionGroup: transactionGroup.TransactionGroup, // data returned this way from query
            },
          },
        )
        .then(transactions => {
          const extraTxn = transactions.filter(t => !t.FromCollectiveId)[0];

          if (extraTxn) {
            return sequelize.query(
              `
            UPDATE "Transactions"
              SET "deletedAt" = :date
            WHERE id = :tId
            `,
              {
                replacements: {
                  date: new Date(),
                  tId: extraTxn.id,
                },
              },
            );
          } else {
            throw Error('Error finding transaction without FromCollectiveId');
          }
        });
    });
};

// Make sure every Transaction has a TxnGroup
const addTransactionGroupsForOrders = sequelize => {
  // find all txns without TransactionGroup and with OrderId
  // there are more efficient ways of doing this, not worth it for a one-time run
  return sequelize
    .query(
      `
    SELECT DISTINCT("OrderId") FROM "Transactions"
    WHERE "TransactionGroup" IS NULL
      AND "OrderId" IS NOT NULL
    ORDER BY "OrderId"
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(orderIds => {
      // find matching pairs by Orders
      console.log('>>> OrderIds Found: ', orderIds.length);
      return orderIds;
    })
    .each(orderId => {
      console.log('>>> Processing OrderId', orderId.OrderId);
      return sequelize
        .query(
          `
      SELECT * FROM "Transactions"
      WHERE "OrderId" = :orderId AND 
        "TransactionGroup" IS NULL
      `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
              orderId: orderId.OrderId,
            },
          },
        )
        .then(txns => {
          if (txns.length != 2) {
            console.log(txns.length);
            throw Error('Expected two transactions with this orderId: ', orderId.OrderId);
          } else {
            return sequelize
              .query(
                `
          UPDATE "Transactions"
            SET "TransactionGroup" = :uuid
          WHERE "OrderId" = :orderId
            AND "TransactionGroup" IS NULL
          `,
                {
                  replacements: {
                    uuid: uuidv4(),
                    orderId: orderId.OrderId,
                  },
                },
              )
              .catch(err => {
                console.log(err);
              });
          }
        });
    });
};

const addTransactionGroupsForExpenses = sequelize => {
  // find all txns without TransactionGroup and with ExpenseId
  // there are more efficient ways of doing this, not worth it for a one-time run
  return sequelize
    .query(
      `
    SELECT DISTINCT("ExpenseId") FROM "Transactions"
    WHERE "TransactionGroup" IS NULL
      AND "ExpenseId" IS NOT NULL
    ORDER BY "ExpenseId"
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(expenseIds => {
      // find matching pairs by Expenses
      console.log('>>> ExpenseIds Found: ', expenseIds.length);
      return expenseIds;
    })
    .each(expenseId => {
      console.log('>>> Processing ExpenseId', expenseId.ExpenseId);
      return sequelize
        .query(
          `
      SELECT * FROM "Transactions"
      WHERE "ExpenseId" = :expenseId AND 
        "TransactionGroup" IS NULL
      `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: {
              expenseId: expenseId.ExpenseId,
            },
          },
        )
        .then(txns => {
          if (txns.length != 2) {
            console.log(txns.length);
            throw Error('Expected two transactions with this expenseId: ', expenseId.ExpenseId);
          } else {
            return sequelize
              .query(
                `
          UPDATE "Transactions"
            SET "TransactionGroup" = :uuid
          WHERE "ExpenseId" = :expenseId
            AND "TransactionGroup" IS NULL
          `,
                {
                  replacements: {
                    uuid: uuid.v4(),
                    expenseId: expenseId.ExpenseId,
                  },
                },
              )
              .catch(err => {
                console.log(err);
              });
          }
        });
    });
};

// Take remaining rows that don't have a TransactionGroup and FromCollectiveId
// and remove them
const deleteRowsWithoutTransactionGroup = sequelize => {
  console.log('>>> Deleting remaining rows without TransanctionGroup and without FromCollectiveId');
  return sequelize.query(
    `
    UPDATE "Transactions"
      SET "deletedAt" = :date
    WHERE "OrderId" IS NULL
      AND "ExpenseId" IS NULL
      AND "deletedAt" IS NULL
      AND "TransactionGroup" IS NULL
      AND "FromCollectiveId" IS NULL
    `,
    {
      replacements: {
        date: new Date(),
      },
    },
  );
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    return fixParentCollectiveIds(queryInterface.sequelize) // needs to happen first
      .then(() => findAndFixSuperCollectives(queryInterface.sequelize))
      .then(() => fixHostCollectiveIds(queryInterface.sequelize))
      .then(() => fixTripleEntryTransactions(queryInterface.sequelize))
      .then(() => addTransactionGroupsForOrders(queryInterface.sequelize))
      .then(() => addTransactionGroupsForExpenses(queryInterface.sequelize))
      .then(() => deleteRowsWithoutTransactionGroup(queryInterface.sequelize))
      .then(() => {
        if (DRY_RUN) {
          throw new Error('Throwing to make sure we can retry this migration');
        }
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
