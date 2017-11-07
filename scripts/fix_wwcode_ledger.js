/*
 * This is a one-time use script to fix wwcode ledger
 */

import models, { sequelize } from '../server/models';

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

const findUserCollectives = (userId) => {
  // given a userId, find out the right Collective for that User

  // first preference, if that user is an admin of a Host, use that
  // Otherwise, use the collective directly connected to that User

  let user;
  const collectives = [];

  return models.User.findById(userId)
    .then(u => user = u)
    .then(() => collectives.push(user.CollectiveId))
    .then(() => {
      return models.Member.findAll({
        where: {
          MemberCollectiveId: user.CollectiveId,
          $and: {
            $or: [{ role: 'ADMIN'}, { role: 'HOST'}]
          }
        }
      })
      .then(members => {
        return members.map(m => m.CollectiveId).concat(collectives);
      })
    });
}


const checkAndFixExpenses = () => {
  /*
  For each expense,
    find the collective associated with the User 
      OR
    If the user is an admin of a host, use that host collective

    Then, check that transaction table shows that as the FromCollectiveId/CollectiveId accurately
    If not, fix it.
  */

  const expensesAffected = [];
  const missingTransactions = [];

  return models.Expense.findAll({
    where: {
      status: 'PAID',
      deletedAt: {
        $eq: null
      },
      CollectiveId: {
        $notIn: [1, 114, 248] // opencollective, partidodigital, wordpress sfo
      },
      payoutMethod: {
        $ne: 'paypal'
      }
    },
    order: ['id']
  })
  .then(expenses => {
    console.log('>>> expenses found', expenses.length);
    return expenses;
  })
  .each(expense => {
    console.log('>>> processing expense id: ', expense.id, 'for collective id', expense.CollectiveId);

    let validUserCollectives;
    return findUserCollectives(expense.UserId)
      .then(userCollectives => {
        validUserCollectives = userCollectives;
        if (validUserCollectives.length === 0) {
          throw new Error('no valid user collective found');
        }
      })
      .then(() => models.Transaction.findAll({
        where: {
          ExpenseId: expense.id
        }
      }))
      .then(transactions => {
        if (transactions.length !== 2) {
          missingTransactions.push(expense.id);
          return Promise.resolve();
        }

        const credit = transactions.find(t => t.type === 'CREDIT');
        const debit = transactions.find(t => t.type === 'DEBIT');

        if (!(validUserCollectives.find(c => c === debit.FromCollectiveId) && 
            validUserCollectives.find(c => c === credit.CollectiveId))) {
          
          console.log('\t>>> FromCollectiveId mismatch for Expense Id', expense.id)
          console.log('\t\t>>> debit.FromCollectiveId', debit.FromCollectiveId, 'credit.CollectiveId', credit.CollectiveId);
          console.log('\t\t>>> Should be: ', validUserCollectives)

          expensesAffected.push(expense.id);
          //return Promise.resolve();
          return debit.update({FromCollectiveId: validUserCollectives[0]})
           .then(() => credit.update({CollectiveId: validUserCollectives[0]}))

         
        }
        return Promise.resolve();
      })
    })
  .then(() => {
    console.log('>>> Total expenses with issues: ', expensesAffected.length);
    console.log('>>> Expense Ids: ', expensesAffected);
    console.log('>>> Missing transactions', missingTransactions.length);
    console.log('>>> Expense Ids:', missingTransactions);
  })
}

const checkAndFixOrders = () => {
  // find all orders and make sure the CreatedByUserId's collective matches the FromCollectiveId

  const ordersFixed = [];
  return models.Order.findAll({
    where: {
      processedAt: {
        $ne: null
      },
      PaymentMethodId: null,
      CollectiveId: {
        $notIn: [114, 92, 234, 304] // ignore collectives that have unrelated weirdness
      },
      CreatedByUserId: {
        $notIn: [772] // ignores threadless type of transactions that are legit and will get screwed up below
      },
      id: {
        $notIn: [2031, 2534, 5752] // one off orders to ignore for various reasons
      }
    },
    include: [
      {model: models.Collective, as: 'collective'}],
    order: ['id']
  })
    .then(orders => {
      console.log('>>> Orders found: ', orders.length);
      return orders;
    })
    .each(order => {

      let validUserCollectives;
      return findUserCollectives(order.CreatedByUserId)
        .then(userCollectives => {
          validUserCollectives = userCollectives;
          if (validUserCollectives.length === 0) {
            throw new Error('no valid user collective found');
          }
          if (!(validUserCollectives.find(c => c === order.FromCollectiveId))) {
            console.log('>>> processing order id', order.id, 'for collective id', order.CollectiveId, order.collective.slug)
            console.log('\t>>> FromCollectiveId mismatch for Order Id', order.id)
            console.log('\t\t>>> order.FromCollectiveId', order.FromCollectiveId);
            console.log('\t\t>>> Should be: ', validUserCollectives)

            return models.Transaction.findAll({
              where: {
                OrderId: order.id
              }
            })
            .then(transactions => {

              if (transactions.length !== 2) {
                throw new Error('transaction.length !== 2 check failed');
              }
              // should only be one of each 
              const credit = transactions.find(t => t.type === 'CREDIT');
              const debit = transactions.find(t => t.type === 'DEBIT');

              ordersFixed.push(order.id);

              return credit.update({FromCollectiveId: validUserCollectives[0]})
              .then(() => debit.update({CollectiveId: validUserCollectives[0]}))
              .then(() => order.update({FromCollectiveId: validUserCollectives[0]}))
            })

          }
          return Promise.resolve();
        })
    })
    .then(() => {
      console.log('>>> orders fixed', ordersFixed.length);
    })
}


function run() {

  return checkAndFixOrders()
  .then(() => checkAndFixExpenses())
  .then(() => done())
  .catch(done)
}

run();