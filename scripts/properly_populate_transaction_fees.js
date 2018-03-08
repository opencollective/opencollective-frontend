/**
 * These are some recommendations for using the script in
 * *development* mode. We currently have ~70000 transactions in our
 * database, running it with a large batch to process all the
 * transactions at once is the fastest way to run it and get the
 * output, however it also exhausts node's memory limits with batches
 * larger than ~50000. Use --max-old-space=8192 to do it all in one
 * batch and iterate faster.
 *
 * If you're running with `--notdryrun` it will be slower because we
 * also save the changes on the database. With that flag, running
 * batches of 1000 it takes ~2m;
 *
 * For production usage, It might be a good idea to break it down in
 * multiple batches to leave some room for the database to process
 * operations from the web clients. I've been running batches of 500
 * and didn't take more than ~3m in my machine (i7~2.2GHz), which is
 * just a little bit slower than running it all in one batch and we
 * don't block the database for other transactions.
 */
import { ArgumentParser } from 'argparse';
import models, { sequelize } from '../server/models';
import * as transactionsLib from '../server/lib/transactions';
import * as paymentsLib from '../server/lib/payments';
import { OC_FEE_PERCENT } from '../server/constants/transactions';
import { sleep } from '../server/lib/utils';

export class Migration {
  constructor(options) {
    this.options = options;
    this.offset = 0;
    this.migrated = 0;
  }

  /** Retrieve the total number of valid transactions */
  countValidTransactions = async () => {
    return models.Transaction.count({ where: { deletedAt: null } });
  }

  /** Retrieve a batch of valid transactions */
  retrieveValidTransactions = async () => {
    const transactions = await models.Transaction.findAll({
      where: { deletedAt: null },
      order: ['TransactionGroup'],
      limit: this.options.batchSize,
      offset: this.offset
      // , include: [{ model: models.Collective, as: 'collective' }]
    });
    this.offset += transactions.length;
    return transactions;
  }

  /** Convert `value` to negative if it's possitive */
  toNegative = (value) => value > 0 ? -value : value;

  /** Saves what type of change was made to a given field in a transaction */
  saveTransactionChange = (tr, field, oldValue, newValue) => {
    if (!tr.data) tr.data = {};
    if (!tr.data.migration) tr.data.migration = {};
    tr.data.migration[field] = { oldValue, newValue };

    // Sequelize isn't really that great detecting changes in JSON
    // fields. So we're explicitly signaling the change.
    tr.changed('data', true);
  }

  /** Ensure that `tr` has the `hostCurrencyFxRate` field filled in */
  ensureHostCurrencyFxRate = (tr) => {
    if (tr.amount === tr.amountInHostCurrency
        && tr.currency === tr.hostCurrency
        && !tr.hostCurrencyFxRate) {
      tr.hostCurrencyFxRate = 1;
      this.saveTransactionChange(tr, 'hostCurrencyFxRate', null, 1);
    }
  }

  /** Rewrite Host, Platform, and Payment Processor Fees
   *
   * It figures out if the given fee exist first in the credit
   * transaction, then in the debit transaction. If no fee is found,
   * the then the transaction is left untouched. */
  rewriteFees = (credit, debit) => {
    // Update hostFeeInHostCurrency
    const newHostFeeInHostCurrency = this.toNegative(credit.hostFeeInHostCurrency || debit.hostFeeInHostCurrency);
    if (newHostFeeInHostCurrency || newHostFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'hostFeeInHostCurrency', credit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      credit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
      this.saveTransactionChange(debit, 'hostFeeInHostCurrency', debit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      debit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
    }
    // Update platformFeeInHostCurrency
    const newPlatformFeeInHostCurrency = this.toNegative(credit.platformFeeInHostCurrency || debit.platformFeeInHostCurrency);
    if (newPlatformFeeInHostCurrency || newPlatformFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'platformFeeInHostCurrency', credit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      credit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
      this.saveTransactionChange(debit, 'platformFeeInHostCurrency', debit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      debit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
    }
    // Update paymentProcessorFeeInHostCurrency
    const newPaymentProcessorFeeInHostCurrency = this.toNegative(credit.paymentProcessorFeeInHostCurrency || debit.paymentProcessorFeeInHostCurrency);
    if (newPaymentProcessorFeeInHostCurrency || newPaymentProcessorFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'paymentProcessorFeeInHostCurrency', credit.paymentProcessorFeeInHostCurrency, newPaymentProcessorFeeInHostCurrency);
      credit.paymentProcessorFeeInHostCurrency = newPaymentProcessorFeeInHostCurrency;
      this.saveTransactionChange(debit, 'paymentProcessorFeeInHostCurrency', debit.paymentProcessorFeeInHostCurrency, newPaymentProcessorFeeInHostCurrency);
      debit.paymentProcessorFeeInHostCurrency = newPaymentProcessorFeeInHostCurrency;
    }
  }

  /** Recalculate host fee if it doesn't round up properly  */
  recalculateHostFee = (credit, debit) => {
    const fee = (credit.hostFeeInHostCurrency || debit.hostFeeInHostCurrency);
    const hostFeePercent = -this.toNegative(fee * 100 / credit.amountInHostCurrency);
    if (!!hostFeePercent && hostFeePercent !== credit.collective.hostFeePercent) {
      const newHostFeeInHostCurrency = this.toNegative(
        paymentsLib.calcFee(credit.amountInHostCurrency, credit.collective.hostFeePercent));
      console.log('Correcting Suspicious hostFee', credit.id,
                  debit.id,
                  credit.amountInHostCurrency,
                  credit.amountInHostCurrency * credit.collective.hostFeePercent / 100,
                  hostFeePercent,
                  newHostFeeInHostCurrency);
      this.saveTransactionChange(credit, 'hostFeeInHostCurrency', credit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      credit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
      this.saveTransactionChange(debit, 'hostFeeInHostCurrency', debit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      debit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
    }

    // I wanted to make sure that it was safe to use the field
    // credit.collective.hostFeePercent like I did above so I wrote
    // the following code to find the approximate value from the data.

    // const hostFee = credit.hostFeeInHostCurrency
    //       || debit.hostFeeInHostCurrency;
    // const amount = credit.amountInHostCurrency
    //       || debit.netAmountInCollectiveCurrency * debit.hostCurrencyFxRate;
    // if (!hostFee || !amount) return;
    //
    // const hostFeePercent = -this.toNegative(hostFee * 100 / amount);
    // if (!hostFeePercent) return;
    //
    // if (hostFeePercent != 5 && hostFeePercent != 10) {
    //   console.log('Correcting Suspicious hostFee',
    //               credit.id,
    //               credit.amountInHostCurrency,
    //               credit.amountInHostCurrency * hostFeePercent / 100,
    //               hostFeePercent);
    //
    //   /* Since the current values are not properly rounded */
    //   let roundHostFeePercent;
    //   if (hostFeePercent > 4 && hostFeePercent < 6)
    //     roundHostFeePercent = 5;
    //   else if (hostFeePercent > 9 && hostFeePercent < 11)
    //     roundHostFeePercent = 10;
    //   else roundHostFeePercent = Math.round(hostFeePercent);
    //
    //   const newHostFeeInHostCurrency =
    //         this.toNegative(paymentsLib.calcFee(
    //           credit.amountInHostCurrency, roundHostFeePercent));
    //   if (newHostFeeInHostCurrency || newHostFeeInHostCurrency === 0) {
    //     this.saveTransactionChange(credit, 'hostFeeInHostCurrency', credit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
    //     credit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
    //     this.saveTransactionChange(debit, 'hostFeeInHostCurrency', debit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
    //     debit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
    //   }
    // }
  }

  /** Recalculate platform fee if it doesn't match OC_FEE_PERCENT  */
  recalculatePlatformFee = (credit, debit) => {
    const fee = (credit.platformFeeInHostCurrency || debit.platformFeeInHostCurrency);
    const platformFeePercent = -this.toNegative(fee * 100 / credit.amountInHostCurrency);
    if (!!platformFeePercent && platformFeePercent !== OC_FEE_PERCENT) {
      console.log('Correcting Suspicious platformFee', credit.id,
                  credit.amountInHostCurrency,
                  credit.amountInHostCurrency * OC_FEE_PERCENT / 100,
                  platformFeePercent);
      const newPlatformFeeInHostCurrency = this.toNegative(
        paymentsLib.calcFee(credit.amountInHostCurrency, OC_FEE_PERCENT));
      this.saveTransactionChange(credit, 'platformFeeInHostCurrency', credit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      credit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
      this.saveTransactionChange(debit, 'platformFeeInHostCurrency', debit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      debit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
    }
  }

  /** Fix rounding errors in fees and rewrite netAmount */
  rewriteFeesAndNetAmount = (credit, debit) => {
    if (!credit.collective || !debit.collective) {
      if (!credit.collective) console.log('credit with no collective!!!!', credit.id);
      if (!debit.collective) console.log('debit with no collective!!!!', credit.id);
      return;
    }
    this.recalculateHostFee(credit, debit);
    this.recalculatePlatformFee(credit, debit);

    /* Rewrite netAmountInCollectiveCurrency for credit */
    const newNetAmountInCollectiveCurrency = transactionsLib.netAmount(credit);
    this.saveTransactionChange(
      credit, 'netAmountInCollectiveCurrency',
      credit.netAmountInCollectiveCurrency,
      newNetAmountInCollectiveCurrency);
    credit.netAmountInCollectiveCurrency = newNetAmountInCollectiveCurrency;

    /* Rewrite amountInHostCurrency & amount for debit */
    const newAmountInHostCurrency = -credit.netAmountInHostCurrency;
    this.saveTransactionChange(
      debit, 'amountInHostCurrency',
      debit.amountInHostCurrency,
      newAmountInHostCurrency);
    debit.amountInHostCurrency = newAmountInHostCurrency;
    this.saveTransactionChange(
      debit, 'amount',
      debit.amount,
      newAmountInHostCurrency);
    debit.amount = newAmountInHostCurrency;
  }

  /** Make sure two transactions are pairs of each other */
  validatePair = (tr1, tr2) => {
    if (tr1.TransactionGroup !== tr2.TransactionGroup) {
      throw new Error('Wrong transaction pair detected');
    }
    if (tr1.ExpenseId !== tr2.ExpenseId) {
      throw new Error('Wrong transaction pair detected: ExpenseId does not match');
    }
    if (tr1.OrderId !== tr2.OrderId) {
      throw new Error('Wrong transaction pair detected: OrderId does not match');
    }
    if (tr1.OrderId && tr1.ExpenseId) {
      throw new Error('tr1 cannot be order & expense');
    }
    if (tr2.OrderId && tr2.ExpenseId) {
      throw new Error('tr2 cannot be order & expense');
    }
  }

  /** Migrate one pair of transactions.
   *
   * Return true if the row was changed and false if it was left
   * untouched. */
  migrate = (tr1, tr2) => {
    console.log(tr1.TransactionGroup);
    console.log(tr2.TransactionGroup);
    this.validatePair(tr1, tr2);

    const credit = tr1.type === 'CREDIT' ? tr1 : tr2;
    const debit =  tr1.type === 'DEBIT' ? tr1 : tr2;

    if (tr1.ExpenseId !== null) {
      // Both CREDIT & DEBIT transactions add up
      if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
        console.log('Expense.: true, true');
        return false;
      }

      // this.rewriteFees(credit, debit);

      console.log('  Expense.:', transactionsLib.verify(tr1), transactionsLib.verify(tr2));

      if (!transactionsLib.verify(credit)) {
        console.log(`EDAU, CREDIT, ${credit.id}, ${credit.TransactionGroup}, ${transactionsLib.difference(credit)}`);
      }
      if (!transactionsLib.verify(debit)) {
        console.log(`EDAU, DEBIT, ${debit.id}, ${debit.TransactionGroup}, ${transactionsLib.difference(debit)}`);
      }
    } else if (tr1.OrderId !== null) {
      if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
        console.log('Order...: true, true');
        return false;
      }

      if (credit.currency !== credit.hostCurrency || debit.currency !== debit.hostCurrency) {
        console.log('Order...:', transactionsLib.verify(credit), transactionsLib.verify(debit), ' # not touched because currency is different');
        return false;
      }

      // Try to set up hostCurrencyFxRate if it's null
      this.ensureHostCurrencyFxRate(credit);
      this.ensureHostCurrencyFxRate(debit);
      if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
        console.log('Order...: true, true # after updating hostCurrencyFxRate');
        return true;
      }

      // Try to just setup fees
      this.rewriteFees(credit, debit);
      if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
        console.log('Order...: true, true # after updating fees');
        return true;
      }

      // -*- Temporarily disabled -*-
      // // Try to recalculate the fees & net amount
      // this.rewriteFeesAndNetAmount(credit, debit);
      // if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
      //   console.log('Order...: true, true # after recalculating fees & net amount');
      //   return true;
      // }

      // Something is still off
      console.log('Order...:', transactionsLib.verify(credit), transactionsLib.verify(debit));
      if (!transactionsLib.verify(credit)) {
        console.log(`ODAU, CREDIT, ${credit.id}, ${credit.TransactionGroup}, ${transactionsLib.netAmount(credit)}, ${transactionsLib.difference(credit)}`);
      }
      if (!transactionsLib.verify(debit)) {
        console.log(`ODAU, DEBIT, ${debit.id}, ${debit.TransactionGroup}, ${transactionsLib.netAmount(debit)}, ${transactionsLib.difference(debit)}`);
      }
    } else {
      console.log('  WAT.....:', transactionsLib.verify(tr1), transactionsLib.verify(tr2));
    }

    // console.log('    * C:amount......: ', credit.amountInHostCurrency);
    // console.log('    * C:netAmount...: ', credit.netAmountInCollectiveCurrency);
    // console.log('    * C:hostFee.....: ', credit.hostFeeInHostCurrency);
    // console.log('    * C:platformFee.: ', credit.platformFeeInHostCurrency);
    // console.log('    * C:ppFee.......: ', credit.paymentProcessorFeeInHostCurrency);

    // console.log('    * D:amount......: ', debit.amountInHostCurrency);
    // console.log('    * D:netAmount...: ', debit.netAmountInCollectiveCurrency);
    // console.log('    * D:hostFee.....: ', debit.hostFeeInHostCurrency);
    // console.log('    * D:platformFee.: ', debit.platformFeeInHostCurrency);
    // console.log('    * D:ppFee.......: ', debit.paymentProcessorFeeInHostCurrency);
    return false;
  }

  /** Print out a CSV line */
  logChange = (tr) => {
    const fields = ((tr.data || {}).migration || {});
    for (const k of Object.keys(fields)) {
      console.log(`CSV:${tr.id},${tr.type},${tr.TransactionGroup},${k},${fields[k].oldValue},${fields[k].newValue}`);
    }
  }

  /** Run the whole migration */
  run = async () => {
    console.log('CSV:id,type,group,field,oldval,newval');
    let rowsChanged = 0;
    const allTransactions = await this.countValidTransactions();
    const count = this.options.limit
          ? Math.min(this.options.limit, allTransactions)
          : allTransactions;
    while (this.offset < count) {
      /* Transactions are sorted by their TransactionGroup, which
       * means that the first transaction is followed by its negative
       * transaction, the third transaction is followed by its pair
       * and so forth. */
      const transactions = await this.retrieveValidTransactions();

      let dbTransaction;
      try {
        dbTransaction = await sequelize.transaction();

        for (let i = 0; i < transactions.length; i += 2) {
          /* Sanity check */
          if (transactions[i].TransactionGroup !== transactions[i + 1].TransactionGroup) {
            throw new Error(`Cannot find pair for the transaction id ${transactions[i].id}`);
          }

          /* Migrate the pair that we just found & log if migration fixed the row */
          const [tr1, tr2] = [transactions[i], transactions[i + 1]];
          if (this.migrate(tr1, tr2)) {
            this.logChange(tr1);
            this.logChange(tr2);
            rowsChanged += 2;
            if (!this.options.dryRun) {
              await tr1.save({ transaction: dbTransaction });
              await tr2.save({ transaction: dbTransaction });
            }
          }
        }

        /* We're done with that batch, let's commit the transaction
         * and take a quick break */
        await dbTransaction.commit();
        await sleep(60);
      } catch (error) {
        console.log('Error saving transactions', error);
        await dbTransaction.rollback();
      }
    }
    console.log(`${rowsChanged} pairs changed`);
  }
}

/* -- Utilities & Script Entry Point -- */

/** Return the options passed by the user to run the script */
function parseCommandLineArguments() {
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'Charge due subscriptions'
  });
  parser.addArgument(['-q', '--quiet'], {
    help: 'Silence output',
    defaultValue: true,
    action: 'storeConst',
    constant: false
  });
  parser.addArgument(['--notdryrun'], {
    help: "Pass this flag when you're ready to run the script for real",
    defaultValue: false,
    action: 'storeConst',
    constant: true
  });
  parser.addArgument(['-l', '--limit'], {
    help: 'total subscriptions to process'
  });
  parser.addArgument(['-b', '--batch-size'], {
    help: 'batch size to fetch at a time',
    defaultValue: 100
  });
  const args = parser.parseArgs();
  return {
    dryRun: !args.notdryrun,
    verbose: !args.quiet,
    limit: args.limit,
    batchSize: args.batch_size
  };
}

/** Print `message` to console if `options.verbose` is true */
function vprint(options, message) {
  if (options.verbose) {
    console.log(message);
  }
}

/** Kick off the script with all the user selected options */
async function entryPoint(options) {
  vprint(options, 'Starting to migrate fees');
  try {
    await (new Migration(options)).run();
  } finally {
    await sequelize.close();
  }
  vprint(options, 'Finished migrating fees');
}

/* Only call entry point if we're arg[0] */
if (!module.parent) entryPoint(parseCommandLineArguments());
