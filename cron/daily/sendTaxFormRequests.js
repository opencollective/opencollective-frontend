#!/usr/bin/env node

import config from 'config';
import HelloWorks from 'helloworks-sdk';
import moment from 'moment';
import { findUsersThatNeedToBeSentTaxForm, SendHelloWorksTaxForm } from '../../server/lib/taxForms';
import { sequelize } from '../../server/models';

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
  await findUsersThatNeedToBeSentTaxForm({
    invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
    year,
  }).map(sendHelloWorksUsTaxForm);
};

init()
  .catch(console.log)
  .finally(() => {
    sequelize.close();
  });
