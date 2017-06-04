/**
 * This scripts populates Transaction.netAmountInTxnCurrency based on historic fxrate
 * 
 * Why? Only Stripe transactions (donations) have fxrate and netAmountInTxnCurrency populated
 * For PayPal and manual reimbursements, we don't have that value.
 */
import config from 'config';
import models from '../server/models';
import { getFxRate } from '../server/lib/currency';
import Promise from 'bluebird';

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

const updateTransaction = (transaction) => {
  return getFxRate(transaction.currency, transaction.txnCurrency, transaction.createdAt)
    .then(fxrate => {
      transaction.txnCurrencyFxRate = fxrate;
      transaction.amountInTxnCurrency = -Math.round(fxrate * transaction.amount); // amountInTxnCurrency is an INTEGER (in cents)
      console.log(`Updating transaction ${transaction.id}:\t${transaction.amount} ${transaction.currency}\ttxnCurrency: ${transaction.txnCurrency}\tamountInTxnCurrency: ${transaction.amountInTxnCurrency}\tfxrate: ${transaction.txnCurrencyFxRate}`);
      return transaction.save({fields: ['txnCurrency','txnCurrencyFxRate','amountInTxnCurrency']});
    })
    .catch(e => {
      console.error("Couldn't get a fxrate for ", transaction.id, e);
    });
}

models.Transaction.findAll()
.tap(transactions => console.log(`Processing ${transactions.length} transactions`))
.then(transactions => Promise.map(transactions, transaction => {

  if (transaction.currency === transaction.txnCurrency) return;
  if (transaction.txnCurrencyFxRate > 0 && transaction.txnCurrencyFxRate !== 1) return;

  if (!transaction.txnCurrency) {
    return transaction.getHost().then(host => {
      if (!host.currency) {
        return console.error("Host has no currency set", host.name, "HostId:", host.id);
      } else {
        transaction.txnCurrency = host.currency;
        return updateTransaction(transaction);
      }
    })
    .catch(console.error)
  } else {
    return updateTransaction(transaction);
  }
}))
.catch(console.error)
.then(() => done())
.catch(done);