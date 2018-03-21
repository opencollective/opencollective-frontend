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
import fs from 'fs';
import { ArgumentParser } from 'argparse';
import { promisify } from 'util';

import models, { sequelize } from '../server/models';
import * as transactionsLib from '../server/lib/transactions';
import * as paymentsLib from '../server/lib/payments';
import { OC_FEE_PERCENT } from '../server/constants/transactions';
import { sleep } from '../server/lib/utils';
import { toNegative } from '../server/lib/math';
import libemail from '../server/lib/email';

const REPORT_EMAIL = 'ops@opencollective.com';

export class Migration {
  constructor(options) {
    this.options = options;
    this.offset = 0;
    this.migrated = 0;
    this.ordersCreated = 0;
    this.counters = {};
    this.logFiles = {};
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
    });
    this.offset += transactions.length;
    return transactions;
  }

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
    const newHostFeeInHostCurrency = toNegative(credit.hostFeeInHostCurrency || debit.hostFeeInHostCurrency);
    if (newHostFeeInHostCurrency || newHostFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'hostFeeInHostCurrency', credit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      credit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
      this.saveTransactionChange(debit, 'hostFeeInHostCurrency', debit.hostFeeInHostCurrency, newHostFeeInHostCurrency);
      debit.hostFeeInHostCurrency = newHostFeeInHostCurrency;
    }
    // Update platformFeeInHostCurrency
    const newPlatformFeeInHostCurrency = toNegative(credit.platformFeeInHostCurrency || debit.platformFeeInHostCurrency);
    if (newPlatformFeeInHostCurrency || newPlatformFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'platformFeeInHostCurrency', credit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      credit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
      this.saveTransactionChange(debit, 'platformFeeInHostCurrency', debit.platformFeeInHostCurrency, newPlatformFeeInHostCurrency);
      debit.platformFeeInHostCurrency = newPlatformFeeInHostCurrency;
    }
    // Update paymentProcessorFeeInHostCurrency
    const newPaymentProcessorFeeInHostCurrency = toNegative(credit.paymentProcessorFeeInHostCurrency || debit.paymentProcessorFeeInHostCurrency);
    if (newPaymentProcessorFeeInHostCurrency || newPaymentProcessorFeeInHostCurrency === 0) {
      this.saveTransactionChange(credit, 'paymentProcessorFeeInHostCurrency', credit.paymentProcessorFeeInHostCurrency, newPaymentProcessorFeeInHostCurrency);
      credit.paymentProcessorFeeInHostCurrency = newPaymentProcessorFeeInHostCurrency;
      this.saveTransactionChange(debit, 'paymentProcessorFeeInHostCurrency', debit.paymentProcessorFeeInHostCurrency, newPaymentProcessorFeeInHostCurrency);
      debit.paymentProcessorFeeInHostCurrency = newPaymentProcessorFeeInHostCurrency;
    }
  }

  /** Fix rounding errors in netAmount (credit) & amountInHostCurrency and netAmount (debit) */
  rewriteNetAmount = (credit, debit) => {
    /* Rewrite netAmountInCollectiveCurrency for credit */
    const newNetAmountInCollectiveCurrency = transactionsLib.netAmount(credit);
    this.saveTransactionChange(
      credit, 'netAmountInCollectiveCurrency',
      credit.netAmountInCollectiveCurrency,
      newNetAmountInCollectiveCurrency);
    credit.netAmountInCollectiveCurrency = newNetAmountInCollectiveCurrency;

    /* Rewrite amountInHostCurrency & amount for debit */
    const newAmountInHostCurrency = -credit.amountInHostCurrency;
    if (debit.amountInHostCurrency !== newAmountInHostCurrency) {
      this.saveTransactionChange(
        debit, 'amountInHostCurrency',
        debit.amountInHostCurrency,
        newAmountInHostCurrency);
      debit.amountInHostCurrency = newAmountInHostCurrency;
    }
    if (debit.amount !== newAmountInHostCurrency) {
      this.saveTransactionChange(
        debit, 'amount',
        debit.amount,
        newAmountInHostCurrency);
      debit.amount = newAmountInHostCurrency;
    }

    /* Rewrite netAmountInHostCurrency for debit */
    const newNetAmountInCollectiveCurrencyDebit = -credit.netAmountInCollectiveCurrency;
    if (debit.newNetAmountInCollectiveCurrency !== newNetAmountInCollectiveCurrencyDebit) {
      this.saveTransactionChange(
        debit, 'netAmountInHostCurrency',
        debit.netAmountInCollectiveCurrency,
        newNetAmountInCollectiveCurrencyDebit);
      debit.netAmountInCollectiveCurrency = newNetAmountInCollectiveCurrencyDebit;
    }
  }

  /** Create an order for orphan transactions */
  createOrder = async (credit, debit) => {
    const order = await models.Order.create({
      CreatedByUserId: credit.CreatedByUserId,
      FromCollectiveId: credit.FromCollectiveId,
      CollectiveId: credit.CollectiveId,
      description: credit.description,
      totalAmount: credit.amount,
      currency: credit.currency,
      processedAt: credit.createdAt,
      PaymentMethodId: credit.PaymentMethodId,
      quantity: 1
    });

    this.saveTransactionChange(credit, 'OrderId', credit.OrderId, order.id);
    credit.OrderId = order.id;

    this.saveTransactionChange(debit, 'OrderId', debit.OrderId, order.id);
    debit.OrderId = order.id;
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

  /** Migrate a pair of transactions */
  migratePair = (type, credit, debit) => {
    const fileName = `broken.${type.toLowerCase()}.csv`;
    const icon = (good) => good ? '✅' : '❌';

    // Both CREDIT & DEBIT transactions add up
    if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
      vprint(`${type}.: true, true`);;
      return false;
    }

    // Don't do anything for now since these are not in the same currency
    // if (credit.currency !== credit.hostCurrency || debit.currency !== debit.hostCurrency) {
    //   const [vc, vd] = [transactionsLib.verify(credit), transactionsLib.verify(debit)];
    //   this.incr('not touched due to different currency');
    //   this.log('report.txt', ` ${icon(vc && vd)} ${type}:${credit.TransactionGroup} ${vc}, ${vd} # not touched because currency is different`);
    //   return false;
    // }

    // Try to set up hostCurrencyFxRate if it's null
    this.ensureHostCurrencyFxRate(credit);
    this.ensureHostCurrencyFxRate(debit);
    if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
      this.incr('fix hostFeeInHostCurrency');
      this.log('report.txt', ` ${icon(true)} ${type}:${credit.TransactionGroup} true, true # after updating hostCurrencyFxRate'`);
      return true;
    }

    // Try to just setup fees
    this.rewriteFees(credit, debit);
    if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
      this.incr('rewrite fees');
      this.log('report.txt', ` ${icon(true)} ${type}:${credit.TransactionGroup} true, true # after updating fees`);
      return true;
    }

    // Fix off by one errors
    // if (transactionsLib.difference(credit) === transactionsLib.difference(debit)
    //     && transactionsLib.difference(credit) === 1) {
      this.rewriteNetAmount(credit, debit);
      if (transactionsLib.verify(credit) && transactionsLib.verify(debit)) {
        this.incr('recalculate net amount');
        this.log('report.txt', ` ${icon(true)} ${type}:${credit.TransactionGroup} true, true # after recalculating netAmount`);
        return true;
      }
    // }

    // Something is still off
    vprint(`${type}.:`, transactionsLib.verify(credit), transactionsLib.verify(debit));
    if (!transactionsLib.verify(credit)) {
      this.log(fileName, `${credit.id}, CREDIT, ${credit.PaymentMethodId}, ${credit.currency}, ${credit.hostCurrency}, ${credit.TransactionGroup}, ${transactionsLib.difference(credit)}`);
    }
    if (!transactionsLib.verify(debit)) {
      this.log(fileName, `${debit.id}, DEBIT, ${debit.PaymentMethodId}, ${debit.currency}, ${debit.hostCurrency}, ${debit.TransactionGroup}, ${transactionsLib.difference(debit)}`);
    }
    return false;
  }

  /** Migrate one pair of transactions.
   *
   * Return true if the row was changed and false if it was left
   * untouched. */
  migrate = async (tr1, tr2) => {
    this.validatePair(tr1, tr2);
    const credit = tr1.type === 'CREDIT' ? tr1 : tr2;
    const debit =  tr1.type === 'DEBIT' ? tr1 : tr2;

    if (tr1.ExpenseId !== null) {
      return this.migratePair('Expense', credit, debit);
    } else if (tr1.OrderId !== null) {
      return this.migratePair('Order', credit, debit);
    } else {
      this.ordersCreated++;
      if (!this.options.dryRun) {
        await this.createOrder(credit, debit);
      }
      this.migratePair('Neither', credit, debit);

      // Even if the migrate pair doesn't do anything, the call to
      // createOrder should change the instance thus we need to return
      // true here otherwise the method `run()` won't know this pair
      // needs to be updated.
      return true;
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

  /** Run the whole migration */
  run = async () => {
    this.log('changes.csv', 'id,type,group,field,oldval,newval');
    let rowsChanged = 0;
    const allTransactions = await this.countValidTransactions();
    const count = this.options.limit
          ? Math.min(this.options.limit, allTransactions)
          : allTransactions;

    this.log('report.txt', `Ledger Fixer Report (dryRun: ${this.options.dryRun})`);
    this.log('report.txt', `Analyzing ${count} of ${allTransactions}\n`);

    while (this.offset < count) {
      /* Transactions are sorted by their TransactionGroup, which
       * means that the first transaction is followed by its negative
       * transaction, the third transaction is followed by its pair
       * and so forth. */
      const transactions = await this.retrieveValidTransactions();

      let dbTransaction;
      try {
        this.log('report.txt', `\nBatch ${this.offset}/${count}: start`);
        dbTransaction = await sequelize.transaction();
        for (let i = 0; i < transactions.length; i += 2) {
          /* Sanity check */
          if (transactions[i].TransactionGroup !== transactions[i + 1].TransactionGroup) {
            throw new Error(`Cannot find pair for the transaction id ${transactions[i].id}`);
          }

          /* Migrate the pair that we just found & log if migration fixed the row */
          const [tr1, tr2] = [transactions[i], transactions[i + 1]];
          if (await this.migrate(tr1, tr2)) {
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
        await dbTransaction.rollback();
        this.log('report.txt', `\nBatch ${this.offset}/${count}: FAILED!\n`);
        this.log('report.txt', `Error ${error}`);
      }
    }

    this.log('report.txt', '\nSummary:');
    this.log('report.txt', `${rowsChanged} pairs changed`);
    this.log('report.txt', `${this.ordersCreated} orders created`);

    this.log('report.txt', `\nTransactions fixed:`);
    for (const counter of Object.keys(this.counters)) {
        this.log('report.txt', ` * ${counter} ${this.counters[counter]}`);
    }

    this.log('report.txt', `\nTransactions with problems:`);
    for (const filename of Object.keys(this.logFiles)) {
      if (filename.startsWith('broken.')) {
        this.log('report.txt', ` * ${filename} ${this.logFiles[filename].length}`);
      }
    }
  }

  incr = (counter) => {
    if (!this.counters[counter]) this.counters[counter] = 0;
    this.counters[counter]++;
  }

  log = (name, msg) => {
    if (!this.logFiles[name]) {
      this.logFiles[name] = [];
    }

    this.logFiles[name].push(msg);

    if (this.options.verbose) {
      console.log(name, msg);
    }
  }

  /** Print out a CSV line */
  logChange = (tr) => {
    const fields = ((tr.data || {}).migration || {});
    for (const k of Object.keys(fields)) {
      this.log('changes.csv', `${tr.id},${tr.type},${tr.TransactionGroup},${k},${fields[k].oldValue},${fields[k].newValue}`);
    }
  }

  report = async () => {
    const body = this.logFiles['report.txt'].join('\n');
    const attachments = [];
    for (const filename of Object.keys(this.logFiles)) {
      if (filename !== 'report.txt') {
        const content = this.logFiles[filename].join('\n');
        attachments.push({ filename, content });
      }
    }

    const icon = Object.keys(this.logFiles).length !== 2 ? '❌' : '✅';
    if (this.options.dryRun) {
      return saveReport(body, attachments);
    } else {
      return emailReport(`${icon} Ledger Fixer Report`, body, attachments);
    }
  }
}

/* -- Report functions -- */

/** Sends the report to REPORT_EMAIL address */
async function saveReport(text, attachments) {
  const write = promisify(fs.writeFile);
  await write('report.txt', text);
  for (const attachment of attachments) {
    await write(attachment.filename, attachment.content);
  }
}

/** Sends the report to REPORT_EMAIL address */
async function emailReport(subject, text, attachments) {
  return libemail.sendMessage(REPORT_EMAIL, subject, '', {
    text, attachments
  });
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
  const migration = new Migration(options);
  try {
    await migration.run();
  } finally {
    vprint(options, 'Running report');
    await migration.report();
    await sequelize.close();
  }
  vprint(options, 'Finished migrating fees');
}

/* Only call entry point if we're arg[0] */
if (!module.parent) entryPoint(parseCommandLineArguments());
