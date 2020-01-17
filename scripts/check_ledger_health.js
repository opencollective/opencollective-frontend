#!/usr/bin/env node
import '../server/env';

/*
 * This script runs through a few checks and lets us know if something is off
 */

import Promise from 'bluebird';
// import { parse as json2csv } from 'json2csv';
import models, { sequelize, Op } from '../server/models';
import emailLib from '../server/lib/email';
// import * as transactionsLib from '../../server/lib/transactions';
import { formatCurrency } from '../server/lib/utils';
// import moment from 'moment';

const VERBOSE = true;
const attachments = [];
let result = '';
let start;
let issuesFound = false;

const done = err => {
  if (err) {
    result = result.concat('err', err);
  }
  result = result.concat('\n\nTotal time taken: ', new Date() - start, 'ms');
  console.log(result);
  console.log('\ndone!\n');
  ('');
  const subject = `${issuesFound ? '❌' : '✅'} Daily ledger health report - ${new Date().toLocaleDateString()}`;
  return emailLib
    .sendMessage('ops@opencollective.com', subject, '', {
      bcc: ' ',
      text: result,
      attachments,
    })
    .then(process.exit)
    .catch(console.error);
};

/* Helper functions */
const judgment = (value, goodFunc) => {
  if ((goodFunc && goodFunc(value)) || (!goodFunc && value === 0)) {
    return '✅';
  } else {
    issuesFound = true;
    return '❌';
  }
};

const header = str => {
  const newString = `\n>>> ${str}\n`;
  result = result.concat(newString);
  console.log(newString);
};

const subHeader = (str, value, goodFunc) => {
  const newString = `  ${judgment(value, goodFunc)}  ${str}: ${value}\n`;
  result = result.concat(newString);
  console.log(newString);
};

const verboseData = (values, mapFunction) => {
  const mapFunc = mapFunction || (o => o);
  if (VERBOSE && values.length > 0) {
    const slice = 5;
    const output = values.slice(0, slice).map(mapFunc);
    output.forEach(v => {
      const newString = `    ▫️ ${JSON.stringify(v)}\n`;
      result = result.concat(newString);
      console.log(newString);
    });
    if (values.length > 10) {
      const newString = `    ... and ${values.length - slice} more`;
      result = result.concat(newString);
      console.log(newString);
    }
  }
};

/* **** functions that check for various things **** */

const checkHostsUserOrOrg = () => {
  header('Checking Hosts must be USER or ORG');

  const hostErrors = [];

  // Check that a Host is a User or an ORG
  return sequelize
    .query(
      `
    WITH hosts as (SELECT distinct("HostCollectiveId") from "Collectives")

    SELECT id, type, slug from "Collectives"
    WHERE id IN (SELECT * FROM hosts);
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(hostCollectives => {
      subHeader('Hosts found', hostCollectives.length, h => h > 0);
      return hostCollectives;
    })
    .each(hostCollective => {
      if (hostCollective.type !== 'USER' && hostCollective.type !== 'ORGANIZATION') {
        hostErrors.push(hostCollective);
      }
    })
    .then(() => {
      subHeader('Hosts found with incorrect type', hostErrors.length);
      verboseData(hostErrors, h => Object.assign({ slug: h.slug, type: h.type }));
    });
};

// Ensure all Collectives are setup properly
const checkHostCollectives = () => {
  header('Checking Host Collectives');

  // Check that a collective is not setup to host itself or be it's own parentCollectiveId
  return models.Collective.findAll({
    where: {
      HostCollectiveId: {
        [Op.col]: 'id',
      },
    },
  }).then(selfReferencingHosts => {
    subHeader('Self-referencing Hosts found', selfReferencingHosts.length);
    verboseData(selfReferencingHosts, h => Object.assign({ slug: h.slug, id: h.id }));
  });
};

const checkUsersAndOrgs = () => {
  header('Checking USER and ORG Collectives');

  // Check that no User or ORG has a HostCollectiveId or ParentCollectiveId
  return (
    models.Collective.findAll({
      where: {
        type: {
          [Op.or]: ['USER', 'ORGANIZATION'],
        },
        HostCollectiveId: {
          [Op.ne]: null,
        },
      },
    })
      .then(collectives => {
        subHeader('USER or ORGs found with HostCollectiveId', collectives.length);
        verboseData(collectives, c => Object.assign({ slug: c.slug, HostCollectiveId: c.HostCollectiveId }));
      })
      // TODO: Check that no non-USER Collective is directly linked to a USER
      .then(() =>
        models.User.findAll({
          attributes: ['CollectiveId'],
        }),
      )
      .then(userCollectives =>
        models.Collective.findAll({
          where: {
            id: {
              [Op.in]: userCollectives.map(u => u.CollectiveId),
            },
            type: {
              [Op.ne]: 'USER',
            },
          },
        }),
      )
      .then(improperlyLinkedCollectives => {
        subHeader('Non-User collectives that are linked to a USER', improperlyLinkedCollectives.length);
        verboseData(improperlyLinkedCollectives, c => Object.assign({ id: c.id, slug: c.slug }));
      })
  );
};

const checkMembers = () => {
  header('Checking Members table');

  return models.Member.findAll({
    where: {
      MemberCollectiveId: {
        [Op.col]: 'CollectiveId',
      },
    },
  }).then(circularMembers => {
    subHeader('Members with CollectiveId = MemberCollectiveId', circularMembers.length);
    verboseData(circularMembers, cm => cm.id);
  });
};

/* DISABLED, matching funds fail this check
// TODO: Find a way to filter out matching funds
// Check orders
const checkOrders = () => {

  header('Check orders');

  // Check that FromCollectiveId on an Order matches all Transactions
  const brokenOrders = [];
  let orders, transactions;
  // ignores prepaid orders that have 4 transactions with different fromCollectiveId
  return sequelize.query(`
    SELECT o.id from "Orders" o
    LEFT JOIN "PaymentMethods" pm on o."PaymentMethodId" = pm.id
    WHERE o."deletedAt" is null AND o."processedAt" is not null AND o."CollectiveId" != 1 AND pm.service not ilike 'opencollective' AND pm.type not ilike 'prepaid'
    `, { type: sequelize.QueryTypes.SELECT
    })
    .then(o => {
      orders = o;
      subHeader('orders found', orders.length, o => o > 0);
    })
    .then(() => sequelize.query(`
      SELECT distinct("FromCollectiveId"), "OrderId" from "Transactions"
      WHERE type LIKE 'CREDIT' AND "deletedAt" is null
      `, {
        type: sequelize.QueryTypes.SELECT
      }))
    .then(txns => {
      transactions = txns;
    })
    .then(() => orders)
    .each(order => {
      const fromCollectiveIds = transactions.filter(txn => txn.OrderId === order.id)
      if (fromCollectiveIds.length > 1) {
        brokenOrders.push(order)
      }
      return Promise.resolve();
    })
    .then(() => {
      subHeader('orders found with mismatched FromCollectiveId', brokenOrders.length);
      verboseData(brokenOrders, o => o.id);
    })
} */

// Check expenses
const checkExpenses = () => {
  header('Check expenses');

  // Check that there are no expenses marked as "PAID" and without transaction entries
  return sequelize
    .query(
      `
    SELECT
      e.id AS id
    FROM "Expenses" e
    LEFT JOIN "Transactions" t ON t."ExpenseId" = e.id
    WHERE e.status ILIKE 'paid' AND t.id IS NULL AND  e."deletedAt" IS NULL
    ORDER BY "ExpenseId" DESC, e."updatedAt"
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    )
    .then(expenses => {
      subHeader('Paid expenses found without transactions', expenses.length);
      verboseData(expenses, e => Object.assign({ id: e.id }));
    });
};

// Check all transactions
const checkTransactions = () => {
  header('Checking Transactions...');

  // Check every transaction has a "FromCollectiveId"
  return (
    models.Transaction.count({
      where: {
        FromCollectiveId: {
          [Op.eq]: null,
        },
      },
    })
      .then(txsWithoutFromCollectiveId => {
        subHeader('Transactions without `FromCollectiveId`', txsWithoutFromCollectiveId);
      })

      // Check no transaction has same "FromCollectiveId" and "CollectiveId"
      .then(() =>
        models.Transaction.findAll({
          where: {
            CollectiveId: {
              [Op.col]: 'FromCollectiveId',
            },
          },
        }),
      )
      .then(circularTxs => {
        subHeader('Transactions with same source and destination', circularTxs.length);
        verboseData(circularTxs, t => Object.assign({ id: t.id }));
      })

      // check no transactions without TransactionGroup
      .then(() =>
        models.Transaction.count({
          where: {
            TransactionGroup: {
              [Op.eq]: null,
            },
          },
        }),
      )
      .then(txnsWithoutTransactionGroup => {
        subHeader('Transactions without `TransactionGroup`', txnsWithoutTransactionGroup);
      })

      // Check every Order has even number of entries
      .then(() =>
        sequelize.query(
          `
    SELECT "OrderId" FROM "Transactions"
        WHERE "OrderId" IS NOT NULL and "deletedAt" is null
          GROUP BY "OrderId"
          HAVING COUNT(*) % 2 != 0
    `,
          { type: sequelize.QueryTypes.SELECT },
        ),
      )
      .then(oddOrderIds => {
        subHeader('Orders with odd (not multiple of 2) number of transactions', oddOrderIds.length);
      })

      // Check every Expense has a double Entry, excluding  ExpenseId (1740, 1737, 1956) (cheeselab known issue)
      .then(() =>
        sequelize.query(
          `
    with "invalidExpenses" AS (
      SELECT MAX(e.id) as "ExpenseId", max(e."legacyPayoutMethod") as "legacyPayoutMethod", count(*) as "numberOfTransactions",
        CASE
        WHEN (MAX(e."legacyPayoutMethod") = 'donation' AND COUNT(*) = 4) THEN true
        WHEN (MAX(e."legacyPayoutMethod") != 'donation' AND COUNT(*) != 2) THEN false
        ELSE true
        END as valid
      FROM "Transactions" t LEFT JOIN "Expenses" e ON t."ExpenseId" = e.id
              WHERE "ExpenseId" IS NOT NULL and t."deletedAt" is null AND "ExpenseId"  NOT IN (1740, 1737, 1956)
                GROUP BY "ExpenseId"
                HAVING COUNT(*) != 2
      )
      SELECT ie."ExpenseId", ie."numberOfTransactions", c.slug as collective, e.category, e.amount, e.currency, e.description, e."legacyPayoutMethod", u.email as "user email", e."incurredAt", e."createdAt", e."updatedAt" FROM "invalidExpenses" ie LEFT JOIN "Expenses" e ON ie."ExpenseId" = e.id LEFT JOIN "Users" u ON u.id=e."UserId" LEFT JOIN "Collectives" c ON c.id=e."CollectiveId" WHERE e.id IN (select "ExpenseId" FROM "invalidExpenses" WHERE valid is false)
    `,
          { type: sequelize.QueryTypes.SELECT },
        ),
      )
      .then(invalidExpenses => {
        subHeader('Expenses with invalid number of transactions', invalidExpenses.length);
        verboseData(invalidExpenses);
      })

      // Check all TransactionGroups have two entries, one CREDIT and one DEBIT
      .then(() =>
        sequelize.query(
          `
    SELECT "TransactionGroup" FROM "Transactions"
        WHERE "TransactionGroup" IS NOT NULL and "deletedAt" is null
          GROUP BY "TransactionGroup"
          HAVING COUNT(*) != 2
    `,
          { type: sequelize.QueryTypes.SELECT },
        ),
      )
      .then(oddTxnGroups => {
        subHeader('Transaction groups that are not pairs', oddTxnGroups.length);
        verboseData(oddTxnGroups);
      })

      // Check no transactions without either an Expense or Order
      .then(() =>
        models.Transaction.findAll({
          where: {
            OrderId: {
              [Op.eq]: null,
            },
            ExpenseId: {
              [Op.eq]: null,
            },
          },
        }),
      )
      .then(txnsWithoutOrderOrExpenses => {
        subHeader('Transactions without OrderId or ExpenseId', txnsWithoutOrderOrExpenses.length);
        // if (VERBOSE)
        // txnsWithoutOrderOrExpenses.map(t => Object.assign({id: t.id}));
      })

    // Check that various fees and amounts add up
    /*
      .then(async () => {
        const allTransactions = await models.Transaction.findAll({
          where: { deletedAt: null },
        });
        const funkyTransactions = allTransactions
          .filter(tr => transactionsLib.verify(tr) !== true)
          .map(tr => ({
            ...tr.dataValues,
            validation: transactionsLib.verify(tr),
            offBy: transactionsLib.difference(tr),
          }));
        const collectiveIds = [];
        funkyTransactions.map(ft => {
          collectiveIds.push(ft.CollectiveId);
          collectiveIds.push(ft.HostCollectiveId);
        });
        const collectives = await models.Collective.findAll({
          attributes: ['id', 'slug'],
          where: { id: { [Op.in]: collectiveIds } },
        });
        const collectiveSlugById = {};
        collectives.map(c => {
          collectiveSlugById[c.id] = c.slug;
        });
        funkyTransactions.map(ft => {
          if (ft.HostCollectiveId) {
            ft.host = collectiveSlugById[ft.HostCollectiveId];
          }
          ft.collective = collectiveSlugById[ft.CollectiveId];
        });
        const fields = [
          'validation',
          'id',
          'host',
          'hostCurrency',
          'collective',
          'currency',
          'type',
          'amount',
          'amountInHostCurrency',
          'netAmountInCollectiveCurrency',
          'hostFeeInHostCurrency',
          'platformFeeInHostCurrency',
          'paymentProcessorFeeInHostCurrency',
          'OrderId',
          'ExpenseId',
          'description',
          'offBy',
        ];
        if (funkyTransactions.length > 0) {
          attachments.push({
            filename: `${moment(new Date()).format('YYYYMMDD')}-invalid-transactions.csv`,
            content: json2csv(funkyTransactions, {fields}),
          });
        }
        subHeader("Transactions that don't add up", funkyTransactions.length);
      })
    */
  );
};

const checkCollectiveBalance = () => {
  const brokenCollectives = [];
  header('Checking balance of each collective (EVENT or COLLECTIVE)');
  return models.Collective.findAll({
    attributes: ['id', 'slug', 'currency'],
    where: {
      [Op.or]: [{ type: 'COLLECTIVE' }, { type: 'EVENT' }],
      id: {
        [Op.notIn]: [7, 34],
      },
    },
  })
    .then(collectives => {
      subHeader('Collectives found', collectives.length, l => l > 0);
      return collectives;
    })
    .each(collective => {
      return collective.getBalance().then(balance => {
        if (balance < 0) {
          collective.balance = balance;
          brokenCollectives.push(collective);
        }
        return Promise.resolve();
      });
    })
    .then(() => {
      subHeader('Collectives with negative balance: ', brokenCollectives.length);
      verboseData(brokenCollectives, c =>
        Object.assign({
          id: c.id,
          slug: c.slug,
          balance: formatCurrency(c.balance, c.currency, 2),
        }),
      );
    });
};

const run = () => {
  console.log('\nStarting check_ledger_health script...');
  start = new Date();

  return (
    checkHostsUserOrOrg()
      .then(() => checkHostCollectives())
      .then(() => checkUsersAndOrgs())
      .then(() => checkMembers())
      // .then(() => checkOrders())
      .then(() => checkExpenses())
      .then(() => checkTransactions())
      .then(() => checkCollectiveBalance())
      .then(() => done())
      .catch(done)
  );
};

run();
