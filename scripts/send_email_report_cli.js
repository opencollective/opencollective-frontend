#!/usr/bin/env node
import '../server/env';

console.log('This script is being deprecated.');
console.log('To re-enable it, remove this message with a Pull Request explaining the use case.');
process.exit();

/*
import util from 'util';
import childProcessPromise from 'child-process-promise';

import prompts from 'prompts';
import moment from 'moment';

const reports = [
  {
    template: 'collective.monthlyreport',
    command: 'cron/monthly/collective-report.js',
  },
  {
    template: 'user.monthlyreport',
    command: 'cron/monthly/user-report.js',
  },
  {
    template: 'user.yearlyreport',
    command: 'cron/yearly/user-report.js',
  },
  {
    template: 'host.monthlyreport',
    command: 'cron/monthly/host-report.js',
  },
  {
    template: 'host.yearlyreport',
    command: 'cron/yearly/host-report.js',
  },
  {
    template: 'user.card.claimed',
    command: 'scripts/compile-email.js user.card.claimed',
  },
];

const PG_DATABASE = process.env.PG_DATABASE || 'opencollective_prod_snapshot';

const exec = childProcessPromise.exec;
const execPromise = util.promisify(exec);

function getChoices(array) {
  return array.map(key => ({ title: key.template, value: key.command }));
}

async function getConfig() {
  const config = {};
  let res;

  try {
    res = await execPromise('heroku config --app opencollective-prod-api | grep MAILGUN');
  } catch (e) {
    throw new Error(
      'Unable to fetch the config vars from heroku. Make sure you have the heroku client installed and that you have access to the production environmnent',
    );
  }

  res.stdout
    .replace(/: +/g, '=')
    .split('\n')
    .forEach(line => {
      if (line.length === 0) return;
      const tokens = line.split('=');
      config[tokens[0]] = tokens[1];
    });

  return config;
}

async function runReport(responses) {
  let config = {};
  if (responses.send) {
    config = await getConfig();
  }
  const env = {
    ...process.env,
    ...config,
    PG_DATABASE,
    DEBUG: 'email,preview',
    WEBSITE_URL: 'https://opencollective.com',
  };
  if (responses.startDate) {
    env.START_DATE = responses.startDate;
  }
  if (responses.recipient) {
    env.ONLY = responses.recipient;
  }
  const slugs = responses.slugs.filter(s => s.length > 0);
  if (slugs.length > 0) {
    env.SLUGS = slugs.join(',');
  }

  const command = `./node_modules/.bin/babel-node ${responses.command}`;
  console.log('>>> command', command);
  return new Promise(resolve => {
    const cmd = exec(command, { env });
    cmd.stdout.pipe(process.stdout);
    cmd.on('exit', () => {
      resolve();
    });
  });
}

async function main() {
  console.log('This utility generates one of the automatic email reports for users or hosts.');
  console.log('Useful for resending a report or for testing.');
  console.log('');
  console.log(`PG_DATABASE=${PG_DATABASE}`);
  console.log('');

  const questions = [
    {
      type: 'select',
      name: 'command',
      message: 'Pick a report',
      choices: getChoices(reports),
      initial: 0,
    },
    {
      type: !process.env.SLUGS && 'list',
      name: 'slugs',
      message: 'List of slugs of the collectives to process (leave empty to process all)',
    },
    {
      type: !process.env.START_DATE && 'text',
      name: 'startDate',
      message: 'Start date',
      initial: moment().format('YYYY-MM-DD'),
      format: val => moment(val).format('YYYY-MM-DD'),
    },
    {
      type: 'confirm',
      name: 'send',
      message: 'Send email?',
      initial: false,
    },
    {
      type: prev => (process.env.ONLY || prev ? 'text' : null),
      name: 'recipient',
      message: 'Recipient email (leave empty to send to the default recipients)',
      validate: val => !val || val.match(/.+@.+\..+/),
    },
  ];

  const responses = await prompts(questions);

  await runReport(responses);

  return 0;
}

main(process)
  .then(process.exit)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

*/
