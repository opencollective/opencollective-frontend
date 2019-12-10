import models from '../../server/models';
import moment from 'moment';

const { RequiredLegalDocument, User, Expense } = models;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;

const US_TAX_FORM_THRESHOLD = 600e2;

const OPEN_SOURCE_COLLECTIVE_ID = 83;

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
