import fs from 'fs';
import json2csv from 'json2csv';
import { ArgumentParser } from 'argparse';

import emailLib from '../../server/lib/email';
import { promiseSeq } from '../../server/lib/utils';
import { sequelize } from '../../server/models';
import {
  ordersWithPendingCharges,
  processOrderWithSubscription,
  groupProcessedOrders,
} from '../../server/lib/subscriptions';

const REPORT_EMAIL = 'ops@opencollective.com';

// These field names are the ones returned by
// processOrderWithSubscription().
const csvFields = [
  'orderId',
  'subscriptionId',
  'amount',
  'from',
  'to',
  'status',
  'error',
  'retriesBefore',
  'retriesAfter',
  'chargeDateBefore',
  'chargeDateAfter',
  'nextPeriodStartBefore',
  'nextPeriodStartAfter'
];

/** Run the script with parameters read from the command line */
async function run(options) {
  const start = new Date;
  const allOrders = await ordersWithPendingCharges();
  const orders = (options.limit) ? allOrders.slice(0, options.limit) : allOrders;
  vprint(options, `${allOrders.length} subscriptions pending charges. Charging ${orders.length} subscriptions right now. dryRun: ${options.dryRun}`);
  const data = [];
  await promiseSeq(orders, async (order) => {
    vprint(options,
           `order: ${order.id}, subscription: ${order.Subscription.id}, ` +
           `attempt: #${order.Subscription.chargeRetryCount}, ` +
           `due: ${order.Subscription.nextChargeDate}`);
    data.push(await processOrderWithSubscription(options, order));
  }, options.batchSize);

  if (data.length > 0) {
    await json2csv({ data, fields: csvFields }, async (err, csv) => {
      vprint(options, 'Writing the output to a CSV file');
      if (err) console.log(err);
      else {
        if (options.dryRun) {
          fs.writeFileSync('charge_subscriptions.output.csv', csv);
        } else {
          if (!options.dryRun) {
            vprint(options, 'Sending email report');
            const attachments = [{
              filename: `${(new Date).toLocaleDateString()}.csv`,
              content: csv
            }];
            await emailReport(start, orders, groupProcessedOrders(data), attachments);
          }
        }
      }
    });
  } else {
    vprint(options, 'Not generating CSV file');
  }
}

/** Send an email with details of the subscriptions processed */
async function emailReport(start, orders, data, attachments) {
  const icon = (err) => err ? '❌' : '✅';
  let result = [`Total Subscriptions pending charges found: ${orders.length}`, ''];

  // Add entries of each group to the result list
  const printGroup = ([ name, { total, entries } ]) => {
    result.push(`>>> ${entries.length} orders ${name} (sum of amounts: ${total})`);
    result = result.concat(entries.map((i) => [
      ` ${i.status !== 'unattempted' ? icon(i.error) : ''} order: ${i.orderId}`,
      `subscription: ${i.subscriptionId}`,
      `amount: ${i.amount}`,
      `from: ${i.from}`,
      `to: ${i.to}`,
      `status: ${i.status}`,
      `error: ${i.error}`,
    ].join(', ')));
    result.push('');
  };

  // Iterate over grouped orders to populate the result list with
  // details of each group
  for (const group of data) printGroup(group);

  // Time we spent running the whole script
  const now = new Date, end = now - start;
  result.push(`\n\nTotal time taken: ${end}ms`);

  // Subject line of the email
  const issuesFound = data.get('canceled') || data.get('past_due');
  const subject = `${icon(issuesFound)} Daily Subscription Report - ${now.toLocaleDateString()}`;

  // Actual send
  return emailLib.sendMessage(REPORT_EMAIL, subject, '', {
    bcc: ' ',
    text: result.join('\n'),
    attachments
  });
}

/** Print `message` to console if `options.verbose` is true */
function vprint(options, message) {
  if (options.verbose) {
    console.log(message);
  }
}

/** Return the options passed by the user to run the script */
function parseCommandLineArguments() {
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'Charge due subscriptions',
  });
  parser.addArgument(['-q', '--quiet'], {
    help: 'Silence output',
    defaultValue: false,
    action: 'storeConst',
    constant: true,
  });
  parser.addArgument(['--dryrun'], {
    help: "Don't perform any changes to the database",
    defaultValue: false,
    action: 'storeConst',
    constant: true,
  });
  parser.addArgument(['-l', '--limit'], {
    help: 'total subscriptions to process'
  });
  parser.addArgument(['-b', '--batch-size'], {
    help: 'batch size to fetch at a time',
    defaultValue: 10
  });
  const args = parser.parseArgs();
  return {
    dryRun: args.dryrun,
    verbose: !args.quiet,
    limit: args.limit,
    batchSize: args.batch_size
  };
}

/** Kick off the script with all the user selected options */
async function entryPoint(options) {
  vprint(options, 'Starting to charge subscriptions');
  try {
    await run(options);
  } finally {
    await sequelize.close();
  }
  vprint(options, 'Finished running charge subscriptions');
}

/* Entry point */
entryPoint(parseCommandLineArguments());
