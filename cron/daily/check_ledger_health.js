/*
 * This script runs through a few checks and lets us know if something is off
 */

import models, { sequelize } from '../../server/models';
import emailLib from '../../server/lib/email';


const VERBOSE = true;
let result = '';
let start;

const done = (err) => {
  if (err) result = result.concat('err', err);
  result = result.concat("\n\nTotal time taken: ", new Date() - start, "ms")
  console.log('\ndone!\n');
  console.log(result);
  const subject = `Daily ledger health report - ${(new Date()).toLocaleDateString()}`;
  return emailLib.sendMessage(
    'ops@opencollective.com', 
    subject, 
    '', {
      bcc: ' ',
      text: result
    })
    .then(process.exit)
    .catch(console.error)
}

const checkHostsUserOrOrg = () => {

  result = result.concat('\n>>> Checking Hosts to be USER or ORG...\n')

  const hostErrors = [];

  // Check that a Host is a User or an ORG
  return sequelize.query(`
    WITH hosts as (SELECT distinct("HostCollectiveId") from "Collectives")

    SELECT * from "Collectives"
    WHERE id IN (SELECT * FROM hosts);
    `, { type: sequelize.QueryTypes.SELECT})
    .then(hostCollectives => {
      result = result.concat('\n\t>>> Hosts found: ', hostCollectives.length);
      return hostCollectives
    })
    .each(hostCollective => {
      if (hostCollective.type !== 'USER' && hostCollective.type !== 'ORGANIZATION') {
        hostErrors.push(hostCollective);
      }
    })
    .then(() => {
      result = result.concat('\n\t>>> Hosts found with incorrect type: ', hostErrors.length)
      if (VERBOSE)
        result = result.concat(hostErrors && JSON.stringify(hostErrors.map(h => Object.assign({slug: h.slug, type: h.type}))));
    });
} 

// Ensure all Collectives are setup properly
const checkHostCollectives = () => {

  result = result.concat('\n>>> Checking Host Collectives...\n')

  // Check that a collective is not setup to host itself or be it's own parentCollectiveId
  return models.Collective.findAll({
    where: {
      HostCollectiveId: {
        $col: 'id'
      }
    }
  })
  .then(selfReferencingHosts => {
    result = result.concat('\n\t>>> Self-referencing Hosts found: ', selfReferencingHosts.length)
    if (VERBOSE)
      result = result.concat(selfReferencingHosts && JSON.stringify(selfReferencingHosts.map(h => Object.assign({slug: h.slug, id: h.id}))))
  })
}

// TODO: make sure every Host has a Stripe Account
const checkHostStripeAccount = () => {
  return sequelize.query(`
  WITH hosts AS 
    (SELECT DISTINCT("HostCollectiveId") AS id FROM "Collectives" c 
      WHERE "HostCollectiveId" IS NOT NULL)
    
  SELECT h.id FROM hosts h
  LEFT JOIN "ConnectedAccounts" ca ON (h.id = ca."CollectiveId")
  WHERE ca."CollectiveId" IS NULL
    `, { type: sequelize.QueryTypes.SELECT})
  .then(hostsWithoutStripe => {
    result = result.concat('\n\t>>> Hosts without Stripe: ', hostsWithoutStripe.length)
    if (VERBOSE)
      result = result.concat(hostsWithoutStripe && JSON.stringify(hostsWithoutStripe.map(h => h.id).join(', ')).concat('\n'));
  })
}

const checkUsersAndOrgs = () => {

  result = result.concat('\n>>> Checking USER and ORG Collectives\n')

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
    result = result.concat('\n\t>>> USER or ORGs found with HostCollectiveId: ', collectives.length)
    if (VERBOSE)
      result = result.concat(JSON.stringify(collectives.map(c => Object.assign({slug: c.slug, HostCollectiveId: c.HostCollectiveId}))))
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
    result = result.concat('\n\t>>> non-User collectives that are linked to a USER: ', improperlyLinkedCollectives.length);
    if (VERBOSE)
      result = result.concat(JSON.stringify(improperlyLinkedCollectives.map(c => Object.assign({id: c.id, slug: c.slug}))));
  })
}

const checkMembers = () => {
  result = result.concat('\n\n>>> Checking Members table\n');

  return models.Member.findAll({
    where: {
      MemberCollectiveId: {
        $col: 'CollectiveId'
      }
    }
  })
  .then(circularMembers => {
    result = result.concat('\n\t>>> Members with CollectiveId = MemberCollectiveId: ', circularMembers.length)
    if (VERBOSE)
      result = result.concat(JSON.stringify(circularMembers.map(cm => cm.id).join(', '))).concat('\n')
  })
}

// TODO: may need to disalbe this check if production sees impact
// Check orders
const checkOrders = () => {

  result = result.concat('\n>>> Check orders\n');

  // Check that FromCollectiveId on an Order matches all Transactions
  const brokenOrders = [];

  return sequelize.query(`
    SELECT * from "Orders"
    WHERE "deletedAt" is null AND "processedAt" is not null AND "CollectiveId" != 1
    `, { type: sequelize.QueryTypes.SELECT
    })
    .then(orders => {
      result = result.concat('\n\t>>> orders found: ', orders.length);
      return orders;
    })
    .each(order => {
      return sequelize.query(`
        SELECT distinct("FromCollectiveId") from "Transactions"
        WHERE "OrderId" = :orderId AND type LIKE 'CREDIT' AND "deletedAt" is null
        `, {
          type: sequelize.QueryTypes.SELECT,
          replacements: {
            orderId: order.id
          }
        })
        .then(FromCollectiveIds => {
          if (FromCollectiveIds.length > 1) {
            brokenOrders.push(order.id);
          }
          return Promise.resolve();
        })
    })
    .then(() => {
      result = result.concat('\n\t>>> orders found with mismatched FromCollectiveId: ', brokenOrders.length, 
        '\n');
      if (VERBOSE)
        result = result.concat(JSON.stringify(brokenOrders))
    })
}

// Check expenses
const checkExpenses = () => {

  result = result.concat('\n\n>>> Check expenses\n');

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
      result = result.concat('\n\t>>> Paid expenses found without transactions: ', expenses.length);
      if (VERBOSE)
        result = result.concat('\n');
        result = result.concat(expenses && JSON.stringify(expenses.map(e => Object.assign({id: e.id}))))
    })
}

// Check all transactions
const checkTransactions = () => {

  result = result.concat('\n\n>>> Checking Transactions...\n')

  // Check every transaction has a "FromCollectiveId"
  return models.Transaction.count({
    where: {
      FromCollectiveId: {
        $eq: null
      }
    }
  })
  .then(txsWithoutFromCollectiveId => {
    result = result.concat('\n\t>>> Transactions without `FromCollectiveId`:', txsWithoutFromCollectiveId);
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
    result = result.concat('\n\t>>> Transactions with same source and destination: ', circularTxs.length)
    if (VERBOSE) 
      result = result.concat(JSON.stringify(circularTxs.map(t => Object.assign({id: t.id}))))
  })

  // check no transactions without TransactionGroup
  .then(() => models.Transaction.count({
    where: {
      TransactionGroup: {
        $eq: null
      }
    }
  }))
  .then(txnsWithoutTransactionGroup => {
    result = result.concat('\n\t>>> Transactions without `TransactionGroup`: ', txnsWithoutTransactionGroup)
  })

  // Check every Order has even number of entries
  .then(() => sequelize.query(`
    SELECT "OrderId" FROM "Transactions"
        WHERE "OrderId" IS NOT NULL and "deletedAt" is null
          GROUP BY "OrderId"
          HAVING COUNT(*) % 2 != 0 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddOrderIds => {
    result = result.concat('\n\t>>> Orders with odd (not multiple of 2) number of transactions: ', oddOrderIds.length)
  })

  // Check every Expense has a double Entry
  .then(() => sequelize.query(`
    SELECT "ExpenseId" FROM "Transactions"
        WHERE "ExpenseId" IS NOT NULL and "deletedAt" is null
          GROUP BY "ExpenseId"
          HAVING COUNT(*) != 2 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddExpenseIds => {
    result = result.concat('\n\t>>> Expenses with less than or more than 2 transactions: ', oddExpenseIds.length, '\n')
    if (VERBOSE)
      result = result.concat(JSON.stringify(oddExpenseIds))
  })

  // Check all TransactionGroups have two entries, one CREDIT and one DEBIT
  .then(() => sequelize.query(`
    SELECT "TransactionGroup" FROM "Transactions"
        WHERE "TransactionGroup" IS NOT NULL and "deletedAt" is null
          GROUP BY "TransactionGroup"
          HAVING COUNT(*) != 2 
    `, {type: sequelize.QueryTypes.SELECT}))
  .then(oddTxnGroups => {
    result = result.concat('\n\t>>> Transaction groups that are not pairs: ', oddTxnGroups.length)
    if (VERBOSE) 
      result = result.concat(oddTxnGroups);
  })

  // Check no transactions without either an Expense or Order
  .then(() => models.Transaction.findAll({
    where: {
      OrderId: {
        $eq: null
      },
      ExpenseId: {
        $eq: null
      }
    }
  }))
  .then(txnsWithoutOrderOrExpenses => {
    result = result.concat('\n\t>>> Transactions without OrderId or ExpenseId: ', txnsWithoutOrderOrExpenses.length)
    // TODO: reenable when this count is lower than 600
    // if (VERBOSE)
    //  txnsWithoutOrderOrExpenses.map(t => Object.assign({id: t.id}));
  })

  // Check that various fees and amounts add up
  // TODO
}

const checkCollectiveBalance = () => {

  const brokenCollectives = [];
  result = result.concat('\n\n>>> Checking balance of each (non-USER, non-ORG) collective\n');
  return models.Collective.findAll({
    where: {
      $or: [{type: 'COLLECTIVE'}, {type: 'EVENT'}]
    }
  })
  .then(collectives => {
    result = result.concat('\n\t>>> Collectives found:', collectives.length);
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
    result = result.concat('\n\t>>> Collectives with negative balance: ', brokenCollectives.length, '\n');
    if (VERBOSE)
      result = result.concat(JSON.stringify(brokenCollectives.map(c => Object.assign({id: c.id, slug: c.slug}))))
  })

}

const run = () => {
  console.log('\nStarting check_ledger_health script...')
  start = new Date();
  
  return checkHostsUserOrOrg()
  .then(() => checkHostCollectives())
  .then(() => checkHostStripeAccount())
  .then(() => checkUsersAndOrgs())
  .then(() => checkMembers())
  .then(() => checkOrders())
  .then(() => checkExpenses())
  .then(() => checkTransactions())
  .then(() => checkCollectiveBalance())
  .then(() => done())
  .catch(done)
}

run();