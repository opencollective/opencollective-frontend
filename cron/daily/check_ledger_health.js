/*
 * This script runs through a few checks and lets us know if something is off
 */

import Promise from 'bluebird';
import json2csv from 'json2csv';
import models, { sequelize, Op } from '../../server/models';
import emailLib from '../../server/lib/email';
import * as transactionsLib from '../../server/lib/transactions';

const VERBOSE = true;
const attachments = [];
let result = '';
let start;
let issuesFound = false;

const done = (err) => {
  if (err) result = result.concat('err', err);
  result = result.concat("\n\nTotal time taken: ", new Date() - start, "ms")
  console.log(result);
  console.log('\ndone!\n');``
  const subject = `${issuesFound ? '❌' : '✅'} Daily ledger health report - ${(new Date()).toLocaleDateString()}`;
  return emailLib.sendMessage(
    'ops@opencollective.com',
    subject,
    '', {
      bcc: ' ',
      text: result,
      attachments
    })
    .then(process.exit)
    .catch(console.error)
}

/* Helper functions */
const judgment = (value, goodFunc) => {
  if ((goodFunc && goodFunc(value)) || (!goodFunc && value === 0)) {
    return '✅'
  } else {
    issuesFound = true;
    return '❌'
  }
}

const header = (str) => {
  const newString = `\n>>> ${str}\n`;
  result = result.concat(newString);
  console.log(newString)
}

const subHeader = (str, value, goodFunc) => {
  const newString = `\t${judgment(value, goodFunc)}  ${str}: ${value}\n`;
  result = result.concat(newString);
  console.log(newString);
}

const verboseData = (values, mapFunction) => {
  const mapFunc = mapFunction || (o => o);
  if (VERBOSE && values.length > 0) {
    const slice = 5;
    const output = values.slice(0, slice).map(mapFunc);
    output.forEach(v => {
      const newString = `\t\t▫️ ${JSON.stringify(v)}\n`;
      result = result.concat(newString)
      console.log(newString);
    })
    if (values.length > 10) {
      const newString = `\t\t... and ${values.length - slice} more`;
      result = result.concat(newString);
      console.log(newString);
    }
  }
}

// Used to fetch external data that only comes in batches
// Like stripe subscription list, only 100 at a time
const fetchAll = (func, options) => {
  return func(options)
    .then(results => {
      // if fetched less than the limit, stop fetching
      if (results.data.length < options.limit) {
        return results.data;
      }
      // otherwise, keep fetching from the end of last set of results
      options.startingAfter = results.data.slice(-1)[0].id;
      return fetchAll(func, options)
        .then(result2 => results.data.concat(result2))
    })
}

/* **** functions that check for various things **** */

const checkHostsUserOrOrg = () => {

  header('Checking Hosts must be USER or ORG');

  const hostErrors = [];

  // Check that a Host is a User or an ORG
  return sequelize.query(`
    WITH hosts as (SELECT distinct("HostCollectiveId") from "Collectives")

    SELECT id, type, slug from "Collectives"
    WHERE id IN (SELECT * FROM hosts);
    `, { type: sequelize.QueryTypes.SELECT})
    .then(hostCollectives => {
      subHeader('Hosts found', hostCollectives.length, h => h > 0);
      return hostCollectives
    })
    .each(hostCollective => {
      if (hostCollective.type !== 'USER' && hostCollective.type !== 'ORGANIZATION') {
        hostErrors.push(hostCollective);
      }
    })
    .then(() => {
      subHeader('Hosts found with incorrect type', hostErrors.length);
      verboseData(hostErrors, h => Object.assign({slug: h.slug, type: h.type}));
    });
}

// Ensure all Collectives are setup properly
const checkHostCollectives = () => {

  header('Checking Host Collectives')

  // Check that a collective is not setup to host itself or be it's own parentCollectiveId
  return models.Collective.findAll({
    where: {
      HostCollectiveId: {
        $col: 'id'
      }
    }
  })
  .then(selfReferencingHosts => {
    subHeader('Self-referencing Hosts found', selfReferencingHosts.length);
    verboseData(selfReferencingHosts, h => Object.assign({slug: h.slug, id: h.id}));
  })
}


const checkUsersAndOrgs = () => {

  header('Checking USER and ORG Collectives');

  // Check that no User or ORG has a HostCollectiveId or ParentCollectiveId
  return models.Collective.findAll({
    where: {
      type: {
        $or: ['USER', 'ORGANIZATION']
      },
      HostCollectiveId: {
        $ne: null
      }
    }
  })
  .then(collectives => {
    subHeader('USER or ORGs found with HostCollectiveId', collectives.length);
    verboseData(collectives, c => Object.assign({slug: c.slug, HostCollectiveId: c.HostCollectiveId}));
  })
  // TODO: Check that no non-USER Collective is directly linked to a USER
  .then(() => models.User.findAll({
    attributes: ['CollectiveId']
  }))
  .then(userCollectives => models.Collective.findAll({
    where: {
      id: {
        $in: userCollectives.map(u => u.CollectiveId)
      },
      type: {
        $ne: 'USER'
      }
    }
  }))
  .then(improperlyLinkedCollectives => {
    subHeader('Non-User collectives that are linked to a USER', improperlyLinkedCollectives.length);
    verboseData(improperlyLinkedCollectives, c => Object.assign({id: c.id, slug: c.slug }));
  })
}

const checkMembers = () => {
  header('Checking Members table');

  return models.Member.findAll({
    where: {
      MemberCollectiveId: {
        $col: 'CollectiveId'
      }
    }
  })
  .then(circularMembers => {
    subHeader('Members with CollectiveId = MemberCollectiveId', circularMembers.length);
    verboseData(circularMembers, cm => cm.id);
  })
}

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
  return sequelize.query(`
    SELECT 
      e.id AS id
    FROM "Expenses" e
    LEFT JOIN "Transactions" t ON t."ExpenseId" = e.id
    WHERE e.status ILIKE 'paid' AND t.id IS NULL AND  e."deletedAt" IS NULL
    ORDER BY "ExpenseId" DESC, e."updatedAt"
    `, { type: sequelize.QueryTypes.SELECT
    })
    .then(expenses => {
      subHeader('Paid expenses found without transactions', expenses.length);
      verboseData(expenses, e => Object.assign({id: e.id}));
    })
}

// Check all transactions
const checkTransactions = () => {

  header('Checking Transactions...')

  // Check every transaction has a "FromCollectiveId"
  return models.Transaction.count({
    where: {
      FromCollectiveId: {
        [Op.eq]: null
      }
    }
  })
  .then(txsWithoutFromCollectiveId => {
    subHeader('Transactions without `FromCollectiveId`', txsWithoutFromCollectiveId);
  })

  // Check no transaction has same "FromCollectiveId" and "CollectiveId"
  .then(() => models.Transaction.findAll({
    where: {
      CollectiveId: {
        $col: 'FromCollectiveId'
      }
    }
  }))
  .then(circularTxs => {
    subHeader('Transactions with same source and destination', circularTxs.length)
    verboseData(circularTxs, t => Object.assign({id: t.id}));
  })

  // check no transactions without TransactionGroup
  .then(() => models.Transaction.count({
    where: {
      TransactionGroup: {
        [Op.eq]: null
      }
    }
  }))
  .then(txnsWithoutTransactionGroup => {
    subHeader('Transactions without `TransactionGroup`', txnsWithoutTransactionGroup)
  })

  // Check every Order has even number of entries
  .then(() => sequelize.query(`
    SELECT "OrderId" FROM "Transactions"
        WHERE "OrderId" IS NOT NULL and "deletedAt" is null
          GROUP BY "OrderId"
          HAVING COUNT(*) % 2 != 0 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddOrderIds => {
    subHeader('Orders with odd (not multiple of 2) number of transactions', oddOrderIds.length)
  })

  // Check every Expense has a double Entry
  .then(() => sequelize.query(`
    SELECT "ExpenseId" FROM "Transactions"
        WHERE "ExpenseId" IS NOT NULL and "deletedAt" is null
          GROUP BY "ExpenseId"
          HAVING COUNT(*) != 2 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddExpenseIds => {
    subHeader('Expenses with less than or more than 2 transactions', oddExpenseIds.length)
    verboseData(oddExpenseIds)
  })

  // Check all TransactionGroups have two entries, one CREDIT and one DEBIT
  .then(() => sequelize.query(`
    SELECT "TransactionGroup" FROM "Transactions"
        WHERE "TransactionGroup" IS NOT NULL and "deletedAt" is null
          GROUP BY "TransactionGroup"
          HAVING COUNT(*) != 2 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddTxnGroups => {
    subHeader('Transaction groups that are not pairs', oddTxnGroups.length)
    verboseData(oddTxnGroups)
  })

  // Check no transactions without either an Expense or Order
  .then(() => models.Transaction.findAll({
    where: {
      OrderId: {
        [Op.eq]: null
      },
      ExpenseId: {
        [Op.eq]: null
      }
    }
  }))
  .then(txnsWithoutOrderOrExpenses => {
    subHeader('Transactions without OrderId or ExpenseId', txnsWithoutOrderOrExpenses.length);
    // if (VERBOSE)
      // txnsWithoutOrderOrExpenses.map(t => Object.assign({id: t.id}));
  })

  // Check that various fees and amounts add up
  .then(async () => {
    const allTransactions = await models.Transaction.findAll({ where: { deletedAt: null } });
    const funkyTransactions = allTransactions
          .filter((tr) => transactionsLib.verify(tr) !== true)
          .map((tr) => ({...tr.dataValues, offBy: transactionsLib.difference(tr)}));
    const fields = ['id', 'amount', 'currency', 'hostCurrency', 'offBy'];
    if (funkyTransactions.length > 0) {
      attachments.push({
        filename: `tr-dont-add-up-${(new Date).toLocaleDateString()}.csv`,
        content: await Promise.promisify(json2csv)({ data: funkyTransactions, fields })
      });
    }
    subHeader("Transactions that don't add up", funkyTransactions.length);
  });
};

const checkCollectiveBalance = () => {

  const brokenCollectives = [];
  header('Checking balance of each (non-USER, non-ORG) collective');
  return models.Collective.findAll({
    attributes: [ 'id' ],
    where: {
      $or: [{type: 'COLLECTIVE'}, {type: 'EVENT'}],
      id: {
        $notIn: [7, 34]
      }
    }
  })
  .then(collectives => {
    subHeader('Collectives found', collectives.length, l => l > 0);
    return collectives;
  })
  .each(collective => {
    return collective.getBalance()
      .then(balance => {
        if (balance < 0) {
          brokenCollectives.push(collective)
        }
        return Promise.resolve();
      })
  })
  .then(() => {
    subHeader('Collectives with negative balance: ', brokenCollectives.length);
    verboseData(brokenCollectives, c => Object.assign({id: c.id, slug: c.slug}))
  })
}

const run = () => {
  console.log('\nStarting check_ledger_health script...')
  start = new Date();

  return checkHostsUserOrOrg()
  .then(() => checkHostCollectives())
  .then(() => checkUsersAndOrgs())
  .then(() => checkMembers())
  //.then(() => checkOrders())
  .then(() => checkExpenses())
  .then(() => checkTransactions())
  .then(() => checkCollectiveBalance())
  .then(() => done())
  .catch(done)
}

run();
