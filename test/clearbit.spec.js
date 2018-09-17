import clearbit from '../server/gateways/clearbit';
import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from '../test/utils';
import userlib from '../server/lib/userlib';

describe('clearbit', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  it('catches the NotFound error', () => {
    const stub = userlib.clearbit.Enrichment.find;
    return clearbit.Enrichment.find({
      email: 'xddddfsdf@gmail.com',
      stream: true,
    }).catch(clearbit.Enrichment.NotFoundError, err => {
      expect(err).to.exist;
      expect(stub.called).to.be.true;
    });
  });
});
