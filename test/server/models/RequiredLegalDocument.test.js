import { expect } from 'chai';
import models from '../../../server/models';
import * as utils from '../../utils';

const { RequiredLegalDocument, Collective } = models;

describe('server/models/RequiredLegalDocument', () => {
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
    const doc = await models.RequiredLegalDocument.create(requiredDoc);

    const retrievedDocs = await hostCollective.getRequiredLegalDocuments();

    expect(retrievedDocs[0].id).to.eq(doc.id);
  });

  it('it can get its associated host collective', async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: hostCollective.id,
      },
    );
    const doc = await models.RequiredLegalDocument.create(requiredDoc);

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
    expect(models.RequiredLegalDocument.create(requiredDoc)).to.be.rejected;
  });

  it('can be created and has expected values', async () => {
    const requiredDoc = Object.assign(
      {},
      {
        HostCollectiveId: hostCollective.id,
      },
    );
    const doc = await models.RequiredLegalDocument.create(requiredDoc);
    expect(doc.documentType).to.eq(RequiredLegalDocument.documentType.US_TAX_FORM);
  });
});
