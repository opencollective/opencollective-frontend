const app = require('../server/index');
import models from '../server/models';

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

// Get all transactions
models.Transaction.findAll({})
.map(transaction => {
  console.log("Processing transaction id: ", transaction.id);

    if (transaction.amount > 0 && transaction.txnCurrencyFxRate) {
      // populate netAmountInCollectiveCurrency for donations
        transaction.netAmountInCollectiveCurrency =
          Math.round((transaction.amountInTxnCurrency -
            transaction.platformFeeInTxnCurrency -
            transaction.hostFeeInTxnCurrency -
            transaction.paymentProcessorFeeInTxnCurrency) *
          transaction.txnCurrencyFxRate);
    } else {
      // populate netAmountInCollectiveCurrency for "Add Funds" and Expenses
      transaction.netAmountInCollectiveCurrency = transaction.amount*100;
    }
  return transaction.save();
})
.then(() => done())
.catch(done)
