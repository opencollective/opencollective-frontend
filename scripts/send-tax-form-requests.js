#!/usr/bin/env node
import '../server/env';

import config from 'config';
import HelloWorks from 'helloworks-sdk';
import moment from 'moment';
import pThrottle from 'p-throttle';

import { findUsersThatNeedToBeSentTaxForm, SendHelloWorksTaxForm } from '../server/lib/tax-forms';
import { sequelize } from '../server/models';

const MAX_REQUESTS_PER_SECOND = 1;
const ONE_SECOND_IN_MILLISECONDS = 1000;

const US_TAX_FORM_THRESHOLD = 600e2;
const HELLO_WORKS_KEY = config.get('helloworks.key');
const HELLO_WORKS_SECRET = config.get('helloworks.secret');
const HELLO_WORKS_WORKFLOW_ID = config.get('helloworks.workflowId');
const HELLO_WORKS_CALLBACK_PATH = config.get('helloworks.callbackPath');

const HELLO_WORKS_CALLBACK_URL = `${config.get('host.api')}${HELLO_WORKS_CALLBACK_PATH}`;

const year = moment().year();

const client = new HelloWorks({
  apiKeyId: HELLO_WORKS_KEY,
  apiKeySecret: HELLO_WORKS_SECRET,
});

const sendHelloWorksUsTaxForm = SendHelloWorksTaxForm({
  client,
  callbackUrl: HELLO_WORKS_CALLBACK_URL,
  workflowId: HELLO_WORKS_WORKFLOW_ID,
  year,
});

const init = async () => {
  console.log('>>>> Running tax form job');
  // Filter unique users
  const users = findUsersThatNeedToBeSentTaxForm({
    invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
    year,
  });

  if (process.env.DRY_RUN) {
    console.log('>> Doing tax form dry run. Emails of users who need tax forms:');
    return users.map(
      pThrottle(
        user => {
          console.log(user.email);
        },
        MAX_REQUESTS_PER_SECOND,
        ONE_SECOND_IN_MILLISECONDS,
      ),
    );
  } else {
    return users.map(
      pThrottle(
        user => {
          console.log(`>> Sending tax form to user: ${user.email}`);
          return sendHelloWorksUsTaxForm(user);
        },
        MAX_REQUESTS_PER_SECOND,
        ONE_SECOND_IN_MILLISECONDS,
      ),
    );
  }
};

init()
  .catch(error => {
    console.log(error);
  })
  .finally(() => {
    sequelize.close();
  });
