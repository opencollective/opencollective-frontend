import { expect } from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const { RequiredLegalDocumentType, Collective } = models;

describe('RequiredLegalDocumentType model', () => {
  // globals to be set in the before hooks.
  let hostCollective;

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

  beforeEach(async () => await utils.resetTestDB());
  beforeEach(async () => {
    hostCollective = await Collective.create(hostCollectiveData);
  });

  it('it can be found via its host collective', async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: hostCollective.id,
      },
    );
    const doc = await models.RequiredLegalDocumentType.create(requiredDoc);

    const retrievedDocs = await hostCollective.getRequiredLegalDocumentTypes();

    expect(retrievedDocs[0].id).to.eq(doc.id);
  });

  it('it can get its associated host collective', async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: hostCollective.id,
      },
    );
    const doc = await models.RequiredLegalDocumentType.create(requiredDoc);

    const retrievedHost = await doc.getHostCollective();

    expect(retrievedHost.id).to.eq(hostCollective.id);
  });

  it("it can't be created if the HostCollectiveId is null", async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: null,
      },
    );
    expect(models.RequiredLegalDocumentType.create(requiredDoc)).to.be.rejected;
  });

  it('can be created and has expected values', async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: hostCollective.id,
      },
    );
    const doc = await models.RequiredLegalDocumentType.create(requiredDoc);
    expect(doc.documentType).to.eq(RequiredLegalDocumentType.documentType.US_TAX_FORM);
  });
});
