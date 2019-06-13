import sinon from 'sinon';
import { expect } from 'chai';
import HelloWorks from 'helloworks-sdk';
import models from '../server/models';
import * as utils from './utils';
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

const client = new HelloWorks({
  apiKeyId: HELLO_WORKS_KEY,
  apiKeySecret: HELLO_WORKS_SECRET,
});

const callbackUrl = 'https://opencollective/api/taxForm/callback';
const workflowId = 'scuttlebutt';
const year = 2019;

describe('lib.taxForms', () => {
  // globals to be set in the before hooks.
  // need:
  // - some users who are over the threshold for this year _and_ last year
  // - some users who are not over the threshold
  // - some users who are over the threshold for this year _and_ that belong to multiple collectives that need a US_TAX_FORM
  // - multiple host collectives that need legal docs
  // - a user that has a document with Error status
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

  const usersData = [
    {
      firstName: 'Xavier',
      lastName: 'Damman',
      email: 'xdamman@opencollective.com',
    },
    {
      firstName: 'Pia',
      lastName: 'Mancini',
      email: 'pia@opencollective.com',
    },
    {
      firstName: 'Piet',
      lastName: 'Geursen',
      email: 'piet@opencollective.com',
    },
    {
      firstName: 'Mix',
      lastName: 'Irving',
      email: 'mix@opencollective.com',
    },
  ];

  const hostCollectivesData = [
    {
      slug: 'myhost',
      name: 'myhost',
      currency: 'USD',
      tags: ['#brusselstogether'],
      tiers: [
        {
          name: 'backer',
          range: [2, 100],
          interval: 'monthly',
        },
        {
          name: 'sponsor',
          range: [100, 100000],
          interval: 'yearly',
        },
      ],
    },
    {
      slug: 'scuttlebutt',
      name: 'scuttlebutt',
      currency: 'USD',
      tags: ['#scuttlebutt'],
      tiers: [
        {
          name: 'backer',
          range: [2, 100],
          interval: 'monthly',
        },
        {
          name: 'sponsor',
          range: [100, 100000],
          interval: 'yearly',
        },
      ],
    },
  ];

  beforeEach(async () => await utils.resetTestDB());
  beforeEach(async () => {
    const users = await Promise.all(usersData.map(userData => User.createUserWithCollective(userData)));
    user = users[0];
    userCollective = await Collective.findByPk(user.CollectiveId);
    const hostCollectives = await Promise.all(
      hostCollectivesData.map(collectiveData => Collective.create(collectiveData)),
    );

    const mixCollective = await Collective.findByPk(users[3].CollectiveId);

    // An expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        CollectiveId: hostCollectives[0].id,
        incurredAt: moment(),
      }),
    );
    // An expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[1].id,
        CollectiveId: hostCollectives[0].id,
        incurredAt: moment(),
      }),
    );
    // An expense from this year under the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[1].id,
        CollectiveId: hostCollectives[0].id,
        incurredAt: moment(),
        amount: US_TAX_FORM_THRESHOLD - 200e2,
      }),
    );
    // An expense from this year over the threshold on the other host collective
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        CollectiveId: hostCollectives[1].id,
        incurredAt: moment(),
      }),
    );
    // An expense from previous year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        CollectiveId: hostCollectives[0].id,
        incurredAt: moment().set('year', 2016),
      }),
    );

    // Mix made an expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[3].id,
        CollectiveId: hostCollectives[0].id,
        incurredAt: moment(),
      }),
    );

    // Mix has a document that's in the error state
    const legalDoc = Object.assign({}, documentData, {
      CollectiveId: mixCollective.id,
      documentStatus: ERROR,
    });
    await LegalDocument.create(legalDoc);

    await Promise.all(
      hostCollectives.map(collective => {
        const requiredDoc = {
          HostCollectiveId: collective.id,
          documentType: US_TAX_FORM,
        };
        return RequiredLegalDocument.create(requiredDoc);
      }),
    );
  });

  describe('findUsersThatNeedToBeSentTaxForm', () => {
    it('it finds the correct users for this year and de-duplicates them', async () => {
      const users = await findUsersThatNeedToBeSentTaxForm({
        invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
        year: moment().year(),
      });
      expect(users.length).to.be.eq(3);
      expect(users.every(async user => (await user.name) !== 'Piet Geursen')).to.be.true;
    });
  });

  describe('sendHelloWorksUsTaxForm', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('sets updates the documents status to requested when the client request succeeds', async () => {
      const legalDoc = Object.assign({}, documentData, {
        CollectiveId: userCollective.id,
      });
      const doc = await LegalDocument.create(legalDoc);

      const resolves = sinon.fake.resolves(null);
      sinon.replace(client.workflowInstances, 'createInstance', resolves);

      const sendHelloWorksUsTaxForm = SendHelloWorksTaxForm({ client, callbackUrl, workflowId, year });

      await sendHelloWorksUsTaxForm(user);

      await doc.reload();
      expect(client.workflowInstances.createInstance.called);
      expect(doc.requestStatus).to.eq(REQUESTED);
    });
    it('sets updates the documents status to error when the client request fails', async () => {
      const legalDoc = Object.assign({}, documentData, {
        CollectiveId: userCollective.id,
      });
      const doc = await LegalDocument.create(legalDoc);

      const resolves = sinon.fake.rejects(null);
      sinon.replace(client.workflowInstances, 'createInstance', resolves);

      const sendHelloWorksUsTaxForm = SendHelloWorksTaxForm({ client, callbackUrl, workflowId, year });

      await sendHelloWorksUsTaxForm(user);

      await doc.reload();
      expect(client.workflowInstances.createInstance.called);
      expect(doc.requestStatus).to.eq(ERROR);
    });
  });
});
