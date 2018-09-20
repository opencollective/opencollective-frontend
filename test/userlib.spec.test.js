import { expect } from 'chai';
import * as utils from '../test/utils';

import config from 'config';
config.clearbit = '***';

import userlib from '../server/lib/userlib';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import mock from './mocks/clearbit';

/**
 * Variables.
 */
const userData1 = utils.data('user1');
const userData3 = utils.data('user3');

describe('userlib', () => {
  let sandbox, stub;
  beforeEach(() => {
    userlib.memory = {};
    sandbox = sinon.createSandbox();
    stub = sandbox.stub(userlib.clearbit.Enrichment, 'find').callsFake(opts => {
      return new Bluebird((resolve, reject) => {
        switch (opts.email) {
          case userData1.email: {
            const NotFound = new userlib.clearbit.Enrichment.NotFoundError(
              ' NotFound',
            );
            reject(NotFound);
            break;
          }
          case userData3.email:
            return resolve(mock);
          default:
            return reject(new Error());
        }
      });
    });
  });

  afterEach(() => sandbox.restore());

  it("doesn't call clearbit if email invalid", () =>
    userlib
      .fetchAvatar('email.com')
      .then(() => expect(stub.called).to.be.false));

  it("can't fetch the image of an unknown email", () =>
    userlib.fetchAvatar(userData1.email).then(image => {
      expect(userlib.memory).to.have.property(userData1.email);
      expect(stub.callCount).to.equal(1);
      expect(image).to.equal(null);
    }));

  it('only calls clearbit server once for an email not found', () =>
    userlib
      .fetchAvatar(userData1.email)
      .then(() => userlib.fetchAvatar(userData1.email))
      .then(image => {
        expect(stub.callCount).to.equal(1);
        expect(image).to.be.falsy;
        expect(image).to.equal(null);
      }));
});
