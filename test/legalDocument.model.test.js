import { expect } from 'chai';
import { SequelizeValidationError } from 'sequelize';
import models from '../server/models';
import * as utils from '../test/utils';

const { LegalDocument, User, Collective } = models;

describe('LegalDocument model', () => {
  // globals to be set in the before hooks.
  let hostCollective, user, userCollective;

  const documentData = {
    year: 2019,
  };

  const userData = {
    username: 'xdamman',
    email: 'xdamman@opencollective.com',
  };

  const hostCollectiveData = {
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
  };

  beforeEach(() => utils.resetTestDB());
  beforeEach(async () => {
    hostCollective = await Collective.create(hostCollectiveData);
    user = await User.createUserWithCollective(userData);
    userCollective = await models.Collective.findByPk(user.CollectiveId);
  });

  it('can set and save a new request status');
  it('it can set and save a new document_link');
  it('it can get its associated host collective');
  it('it can get its associated collective');
  it('it can be found via its host collective');
  it('it can be found via its collective');
  it('it can be deleted without deleting the collectives it belongs to');

  // what's a sensible default for the year? should it be not null? Should it be the same year as is created? Is that safe?

  it("it can't be created if the year is less than 2015", async () => {
    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: hostCollective.id,
      CollectiveId: userCollective.id,
    });
    legalDoc.year = 2014;
    expect(models.LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the year is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: hostCollective.id,
      CollectiveId: userCollective.id,
    });
    delete legalDoc.year;
    expect(models.LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the HostCollectiveId is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: null,
      CollectiveId: userCollective.id,
    });
    expect(models.LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the CollectiveId is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: hostCollective.id,
      CollectiveId: null,
    });
    expect(models.LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it('can be created and has expected values', async () => {
    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: hostCollective.id,
      CollectiveId: userCollective.id,
    });
    const doc = await models.LegalDocument.create(legalDoc);
    expect(doc.request_status).to.eq(LegalDocument.request_status.NOT_REQUESTED);
    expect(doc.document_type).to.eq(LegalDocument.document_type.US_TAX_FORM);
  });
});
