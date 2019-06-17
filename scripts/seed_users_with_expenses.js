import models from '../server/models';
import moment from 'moment';

import { findUsersThatNeedToBeSentTaxForm, SendHelloWorksTaxForm } from '../server/lib/taxForms';

const { RequiredLegalDocument, LegalDocument, Collective, User, Expense } = models;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;
const {
  requestStatus: { REQUESTED, ERROR },
} = LegalDocument;

const US_TAX_FORM_THRESHOLD = 600e2;
const HELLO_WORKS_KEY = '123';
const HELLO_WORKS_SECRET = 'ABC';

const OPEN_SOURCE_COLLECTIVE_ID = 83;

let user, userCollective;

const documentData = {
  year: moment().year(),
};

function ExpenseOverThreshold({ incurredAt, UserId, CollectiveId, amount }) {
  return {
    description: 'pizza',
    amount: amount || US_TAX_FORM_THRESHOLD + 100e2,
    currency: 'USD',
    UserId,
    lastEditedById: UserId,
    incurredAt,
    createdAt: incurredAt,
    CollectiveId,
  };
}

async function run() {
  const usersData = [
    {
      firstName: 'Piet',
      lastName: 'Geursen',
      email: 'piet@protozoa.nz',
    },
  ];
  const users = await Promise.all(usersData.map(userData => User.createUserWithCollective(userData)));
  user = users[0];
  userCollective = await Collective.findByPk(user.CollectiveId);

  // An expense from this year over the threshold
  await Expense.create(
    ExpenseOverThreshold({
      UserId: users[0].id,
      CollectiveId: OPEN_SOURCE_COLLECTIVE_ID,
      incurredAt: moment(),
    }),
  );

  const requiredDoc = {
    HostCollectiveId: OPEN_SOURCE_COLLECTIVE_ID,
    documentType: US_TAX_FORM,
  };
  return RequiredLegalDocument.create(requiredDoc);
}

run().finally(console.log);
