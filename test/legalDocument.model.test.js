import { expect } from 'chai';
import { SequelizeValidationError } from 'sequelize';
import models from '../server/models';
import * as utils from '../test/utils';

const { LegalDocument, User, Collective } = models;

describe('LegalDocument model', () => {
  const documentData = {
    year: '2019',
  };

  const users = [
    {
      username: 'xdamman',
      email: 'xdamman@opencollective.com',
    },
    {
      username: 'piamancini',
      email: 'pia@opencollective.com',
    },
  ];
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
  beforeEach(() => {
    return Promise.all([Collective.create(hostCollectiveData), User.createUserWithCollective(users[0])]);
  });

  it('can set and save a new request status');
  it('it can set and save a new document_link');
  it('it can get its associated host collective');
  it('it can get its associated collective');
  it('it can be found via its host collective');
  it('it can be found via its collective');
  it('it will fail to be created if the year is null');
  it('it will throw if trying to set the year to an invalid value');
  it('it will fail if the year is before 2016');
  it('it will fail if the HostCollectiveId is null');
  it('it will fail if the CollectiveId is null');
  it('it can be deleted without deleting the collectives it belongs to');

  // what's a sensible default for the year? should it be not null? Should it be the same year as is created? Is that safe?

  it('can be created and has expected values', async () => {
    const host = await Collective.findBySlug(hostCollectiveData.slug);
    const user = await User.findOne({
      where: {
        email: users[0].email,
      },
    });

    const userCollective = await models.Collective.findByPk(user.CollectiveId);

    const legalDoc = Object.assign({}, documentData, {
      HostCollectiveId: host.id,
      CollectiveId: userCollective.id,
    });
    const doc = await models.LegalDocument.create(legalDoc);
    expect(doc.request_status).to.eq(LegalDocument.request_status.NOT_REQUESTED);
    expect(doc.document_type).to.eq(LegalDocument.document_type.US_TAX_FORM);
  });
});
