import { expect } from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const { RequiredLegalDocumentType, LegalDocument, User, Collective } = models;
const { US_TAX_FORM } = RequiredLegalDocumentType.documentType;

describe('LegalDocument model', () => {
  // globals to be set in the before hooks.
  let hostCollective, user, userCollective, docType, otherHostCollective, otherDocType;

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

  beforeEach(async () => await utils.resetTestDB());
  beforeEach(async () => {
    hostCollective = await Collective.create(hostCollectiveData);
    user = await User.createUserWithCollective(userData);
    userCollective = await Collective.findByPk(user.CollectiveId);
    docType = await RequiredLegalDocumentType.create({
      HostCollectiveId: hostCollective.id,
    });

    otherHostCollective = await Collective.create({ slug: 'otherHost', nam: 'otherHost' });
    otherDocType = await RequiredLegalDocumentType.create({
      HostCollectiveId: otherHostCollective.id,
    });
  });

  it("it can't be created if the host collective id is not valid");
  it("it can't be created if the user collective id is not valid");

  it('it can set and save a new document_link', async () => {
    const expected = 'a string';
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    doc.documentLink = expected;
    await doc.save();
    await doc.reload();

    expect(doc.documentLink).to.eq(expected);
  });

  // I think this is the correct behaviour. We have to keep tax records for 7 years. Maybe this clashes with GDPR? For now it's only on the Open Source Collective which is US based. So I _think_ it's ok.
  // This assumes collectives will never be force deleted. If they are then the Legal Document model will fail its foreign key constraint when you try and load it.
  it('it will not be deleted if the host collective is soft deleted', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);
    expect(doc.deletedAt).to.eq(null);

    await hostCollective.destroy();

    // This would fail if the doc was deleted
    expect(doc.reload()).to.be.fulfilled;
  });

  // See comment above
  it('it will not be deleted if the user collective is soft deleted', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);
    expect(doc.deletedAt).to.eq(null);

    await userCollective.destroy();

    // This would fail if the doc was deleted
    expect(doc.reload()).to.be.fulfilled;
  });

  it('it can be deleted without deleting the collectives it belongs to', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);
    // Normally docs are soft deleted. This is just checking that worst case we don't accidentally delete collectives.
    await doc.destroy({ force: true });

    await hostCollective.reload();
    await userCollective.reload();

    expect(hostCollective.id).to.not.eq(null);
    expect(userCollective.id).to.not.eq(null);
  });

  it('can set and save a valid new request status', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    expect(doc.requestStatus).to.eq(LegalDocument.requestStatus.NOT_REQUESTED);

    doc.requestStatus = LegalDocument.requestStatus.RECEIVED;
    await doc.save();
    await doc.reload();

    expect(doc.requestStatus).to.eq(LegalDocument.requestStatus.RECEIVED);
  });

  it('it will fail if attempting to set an invalid request status', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    expect(doc.requestStatus).to.eq(LegalDocument.requestStatus.NOT_REQUESTED);

    doc.requestStatus = 'SCUTTLEBUTT';
    expect(doc.save()).to.be.rejected;
  });

  it('it can be found via its host collective', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    const retrievedDocTypes = await hostCollective.getRequiredLegalDocumentTypes();
    const retrievedDocs = await retrievedDocTypes[0].getLegalDocuments();

    expect(retrievedDocs[0].id).to.eq(doc.id);
  });

  it('it can be found via its collective', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    const retrievedDocs = await userCollective.getLegalDocuments();

    expect(retrievedDocs[0].id).to.eq(doc.id);
  });

  it('it can get its associated collective', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    const retrievedCollective = await doc.getCollective();

    expect(retrievedCollective.id).to.eq(userCollective.id);
  });

  it('it can get its associated host collective', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);

    const retrievedHost = await doc.getRequiredLegalDocumentType().then(docType => docType.getHostCollective());

    expect(retrievedHost.id).to.eq(hostCollective.id);
  });

  it("it can't be created if the year is less than 2015", async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    legalDoc.year = 2014;
    expect(LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the year is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    delete legalDoc.year;
    expect(LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the RequiredLegalDocumentTypeId is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: null,
      CollectiveId: userCollective.id,
    });
    expect(LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it("it can't be created if the CollectiveId is null", async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: null,
    });
    expect(LegalDocument.create(legalDoc)).to.be.rejected;
  });

  it('can be created and has expected values', async () => {
    const legalDoc = Object.assign({}, documentData, {
      RequiredLegalDocumentTypeId: docType.id,
      CollectiveId: userCollective.id,
    });
    const doc = await LegalDocument.create(legalDoc);
    expect(doc.requestStatus).to.eq(LegalDocument.requestStatus.NOT_REQUESTED);
  });

  describe('doesUserNeedToBeSentDocument', async () => {
    it('it returns true when a user has not supplied the document', async () => {
      const legalDoc = Object.assign({}, documentData, {
        RequiredLegalDocumentTypeId: docType.id,
        CollectiveId: userCollective.id,
      });

      await LegalDocument.create(legalDoc);

      const result = await LegalDocument.doesUserNeedToBeSentDocument({
        documentType: US_TAX_FORM,
        year: documentData.year,
        user,
      });
      expect(result).to.be.true;
    });

    it('it returns false when the document status is RECEIVED or REQUESTED for the correct year and of the correct type', async () => {
      const legalDoc = Object.assign({}, documentData, {
        RequiredLegalDocumentTypeId: docType.id,
        CollectiveId: userCollective.id,
      });
      const doc = await LegalDocument.create(legalDoc);

      doc.requestStatus = LegalDocument.requestStatus.RECEIVED;
      await doc.save();

      const result = await LegalDocument.doesUserNeedToBeSentDocument({
        documentType: US_TAX_FORM,
        year: documentData.year,
        user,
      });
      expect(result).to.be.false;

      doc.requestStatus = LegalDocument.requestStatus.REQUESTED;
      await doc.save();

      const result2 = await LegalDocument.doesUserNeedToBeSentDocument({
        documentType: US_TAX_FORM,
        year: documentData.year,
        user,
      });
      expect(result2).to.be.false;

      const result3 = await LegalDocument.doesUserNeedToBeSentDocument({
        documentType: US_TAX_FORM,
        year: documentData.year + 1,
        user,
      });
      expect(result3).to.be.true;
    });

    it('it returns false when the document has been filled out for a different host but of the correct type and year', async () => {
      const legalDoc = Object.assign({}, documentData, {
        RequiredLegalDocumentTypeId: docType.id,
        CollectiveId: userCollective.id,
      });

      await LegalDocument.create(legalDoc);

      const otherLegalDoc = Object.assign({}, documentData, {
        RequiredLegalDocumentTypeId: otherDocType.id,
        CollectiveId: userCollective.id,
      });
      const otherDoc = await LegalDocument.create(otherLegalDoc);

      otherDoc.requestStatus = LegalDocument.requestStatus.RECEIVED;
      await otherDoc.save();

      const result = await LegalDocument.doesUserNeedToBeSentDocument({
        documentType: US_TAX_FORM,
        year: documentData.year,
        user,
      });
      expect(result).to.be.false;
    });
  });
});
