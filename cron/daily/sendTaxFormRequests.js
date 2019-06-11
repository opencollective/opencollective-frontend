#!/usr/bin/env node

import config from 'config';
import models from '../../server/models';
import HelloWorks from 'helloworks-sdk';

const US_TAX_FORM_THRESHOLD = 600e2;
const HELLO_WORKS_KEY = config.get('helloworks.key');
const HELLO_WORKS_SECRET = config.get('helloworks.secret');
const HELLO_WORKS_WORKFLOW_ID = config.get('helloworks.workflowId');
const HELLO_WORKS_CALLBACK_PATH = config.get('helloworks.callbackPath');

const HELLO_WORKS_CALLBACK_URL = `${config.get('host.api')}/${HELLO_WORKS_CALLBACK_PATH}`;

const { US_TAX_FORM } = RequiredLegalDocumentType;

const startOfYear = new Date(); // TODO
const endOfYear = new Date(); // TODO

const { RequiredLegalDocumentType, LegalDocument } = models;

const client = new HelloWorks({
  apiKeyId: HELLO_WORKS_KEY,
  apiKeySecret: HELLO_WORKS_SECRET,
});

const init = async () => {
  const usersWhoNeedFormSent = await RequiredLegalDocumentType.findAll({
    where: { documentType: US_TAX_FORM },
  })
    .map(requiredUsTaxDocType => requiredUsTaxDocType.getHostCollective())
    .map(host => host.getUsersWhoHaveTotalExpensesOverThreshold(US_TAX_FORM_THRESHOLD, startOfYear, endOfYear))
    .filter(user => LegalDocument.doesUserNeedToBeSentDocument({ documentType: US_TAX_FORM, year: startOfYear, user }));

  usersWhoNeedFormSent.forEach(sendHelloWorksUsTaxForm);
};

function sendHelloWorksUsTaxForm(user) {
  const participants = {
    participant_swVuvW: {
      type: 'email',
      value: user.email,
      fullName: `${user.firstName} ${user.lastName}`, // Is this an internationalisation problem?
    },
  };

  client.workflowInstances
    .createInstance({
      callbackUrl: HELLO_WORKS_CALLBACK_URL,
      workflowId: HELLO_WORKS_WORKFLOW_ID,
      documentDelivery: true,
      participants,
    })
    .then(() => LegalDocument.findByTypeYearUser({ documentType: US_TAX_FORM, year: startOfYear, user }))
    .then(doc => {
      doc.requestStatus = LegalDocument.requestStatus.REQUESTED;
      return doc.save();
    })
    .catch(async () => {
      const doc = await LegalDocument.findByTypeYearUser({ documentType: US_TAX_FORM, year: startOfYear, user });
      doc.requestStatus = LegalDocument.requestStatus.ERROR;
      await doc.save();
    });
}

init();
