import sinon from 'sinon';
import { expect } from 'chai';
import HelloWorks from 'helloworks-sdk';
import models from '../../../server/models';
import * as utils from '../../utils';
import moment from 'moment';

import {
  findUsersThatNeedToBeSentTaxForm,
  SendHelloWorksTaxForm,
  isUserTaxFormRequiredBeforePayment,
} from '../../../server/lib/tax-forms';

import expenseTypes from '../../../server/constants/expense_type';
const { RECEIPT, INVOICE } = expenseTypes;

const { RequiredLegalDocument, LegalDocument, Collective, User, Expense } = models;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;
const {
  requestStatus: { REQUESTED, ERROR, RECEIVED },
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
const year = moment().year();

describe('server/lib/tax-forms', () => {
  // globals to be set in the before hooks.
  // need:
  // - some users who are over the threshold for this year _and_ last year
  // - some users who are not over the threshold
  // - some users who are over the threshold for this year _and_ that belong to multiple collectives that need a US_TAX_FORM
  // - one host collective that needs legal docs
  // - two hosted collectives that have invoices to them.
  // - a user that has a document with Error status
  let user, userCollective, hostCollective, organisationCollectives;

  const documentData = {
    year: moment().year(),
  };

  function ExpenseOverThreshold({ incurredAt, UserId, CollectiveId, amount, type, FromCollectiveId }) {
    return {
      description: 'pizza',
      amount: amount || US_TAX_FORM_THRESHOLD + 100e2,
      currency: 'USD',
      UserId,
      FromCollectiveId,
      lastEditedById: UserId,
      incurredAt,
      createdAt: incurredAt,
      CollectiveId,
      type: type || INVOICE,
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

  const hostCollectiveData = {
    slug: 'opensource',
    name: 'opensouce',
    currency: 'USD',
    tags: ['#opensource'],
  };

  const organisationCollectivesData = [
    {
      slug: 'babel',
      name: 'babel',
      currency: 'USD',
      tags: ['#babel'],
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
    hostCollective = await Collective.create(hostCollectiveData);

    organisationCollectives = await Promise.all(
      organisationCollectivesData
        .map(collectiveData => {
          collectiveData.HostCollectiveId = hostCollective.id;
          return collectiveData;
        })
        .map(collectiveData => Collective.create(collectiveData)),
    );

    const mixCollective = await Collective.findByPk(users[3].CollectiveId);

    // An expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        FromCollectiveId: users[0].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment(),
      }),
    );
    // An expense from this year over the threshold BUT it's of type receipt so it should not be counted
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[2].id,
        FromCollectiveId: users[2].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment(),
        type: RECEIPT,
      }),
    );
    // An expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[1].id,
        FromCollectiveId: users[1].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment(),
      }),
    );
    // An expense from this year under the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[1].id,
        FromCollectiveId: users[1].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment(),
        amount: US_TAX_FORM_THRESHOLD - 200e2,
      }),
    );
    // An expense from this year over the threshold on the other host collective
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        FromCollectiveId: users[0].CollectiveId,
        CollectiveId: organisationCollectives[1].id,
        incurredAt: moment(),
      }),
    );
    // An expense from previous year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[0].id,
        FromCollectiveId: users[0].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment().set('year', 2016),
      }),
    );

    // Mix made an expense from this year over the threshold
    await Expense.create(
      ExpenseOverThreshold({
        UserId: users[3].id,
        FromCollectiveId: users[3].CollectiveId,
        CollectiveId: organisationCollectives[0].id,
        incurredAt: moment(),
      }),
    );

    // Mix has a document that's in the error state
    const legalDoc = Object.assign({}, documentData, {
      CollectiveId: mixCollective.id,
      documentStatus: ERROR,
    });
    await LegalDocument.create(legalDoc);

    const requiredDoc = {
      HostCollectiveId: hostCollective.id,
      documentType: US_TAX_FORM,
    };

    await RequiredLegalDocument.create(requiredDoc);
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

  describe('isUserTaxFormRequiredBeforePayment', () => {
    it('it returns true when the user is over the threshold but has not returned their form ', async () => {
      const result = await isUserTaxFormRequiredBeforePayment({
        invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
        year: moment().year(),
        expenseCollectiveId: organisationCollectives[0].id,
        UserId: user.id,
      });
      expect(result).to.be.true;
    });
    it('it returns false when all the other conditions are met except the document status is received', async () => {
      const legalDoc = Object.assign({}, documentData, {
        CollectiveId: userCollective.id,
        requestStatus: RECEIVED,
      });
      await LegalDocument.create(legalDoc);

      const result = await isUserTaxFormRequiredBeforePayment({
        invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
        year: moment().year(),
        expenseCollectiveId: organisationCollectives[0].id,
        UserId: user.id,
      });
      expect(result).to.be.false;
    });
    it('it returns false when all the other conditions are met except the host does not require a legal document', async () => {
      const requiredDoc = await hostCollective.getRequiredLegalDocuments();
      requiredDoc[0].destroy();
      const result = await isUserTaxFormRequiredBeforePayment({
        invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
        year: moment().year(),
        expenseCollectiveId: organisationCollectives[0].id,
        UserId: user.id,
      });
      expect(result).to.be.false;
    });
    it('it returns false when all the other conditions are met except the user does not cross the threshold', async () => {
      await Expense.destroy({ where: { UserId: user.id } });

      const result = await isUserTaxFormRequiredBeforePayment({
        invoiceTotalThreshold: US_TAX_FORM_THRESHOLD,
        year: moment().year(),
        expenseCollectiveId: organisationCollectives[0].id,
        UserId: user.id,
      });
      expect(result).to.be.false;
    });
  });

  describe('sendHelloWorksUsTaxForm', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('updates the documents status to requested when the client request succeeds', async () => {
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

      const rejects = sinon.fake.rejects(null);
      sinon.replace(client.workflowInstances, 'createInstance', rejects);

      const sendHelloWorksUsTaxForm = SendHelloWorksTaxForm({ client, callbackUrl, workflowId, year });

      await sendHelloWorksUsTaxForm(user);

      await doc.reload();
      expect(client.workflowInstances.createInstance.called);
      expect(doc.requestStatus).to.eq(ERROR);
    });
  });
});
