
const expect = require('chai').expect;
const utils = require('../test/utils.js')();
const userlib = require('../server/lib/userlib.js');
const sinon = require('sinon');
const Bluebird = require('bluebird');

/**
 * Variables.
 */
const userData1 = utils.data('user1');
const userData3 = utils.data('user3');

const mock = require('./mocks/clearbit.json');

describe("userlib", () => {

  let sandbox, stub;
  beforeEach(() => {
    userlib.memory = {};
    sandbox = sinon.sandbox.create();
    stub = sandbox.stub(userlib.clearbit.Enrichment, 'find', (opts) => {
      return new Bluebird((resolve, reject) => {
        switch (opts.email) {
          case userData1.email: {
            const NotFound = new userlib.clearbit.Enrichment.NotFoundError(' NotFound');
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

  afterEach(() => sandbox.restore() );

  it("doesn't call clearbit if email invalid", () =>
    userlib.fetchAvatar({email: "email.com"})
      .then(() => expect(stub.called).to.be.false));

  it("can't fetch the avatar of an unknown email", () =>
    userlib.fetchAvatar(userData1).then(user => {
      expect(userlib.memory).to.have.property(userData1.email);
      expect(stub.callCount).to.equal(1);
      expect(user).to.deep.equal(userData1);
    }));

  it("only calls clearbit server once for an email not found", () =>
    userlib.fetchAvatar(userData1)
      .then(() => userlib.fetchAvatar(userData1))
      .then(user => {
        expect(stub.callCount).to.equal(1);
        expect(user.avatar).to.be.falsy;
        expect(user).to.deep.equal(userData1);
    }));

  it("fetches the avatar of a known email and only updates the user.avatar", () =>
    userlib.fetchAvatar(userData3).then(user => {
      expect(Object.keys(user).length).to.equal(Object.keys(userData3).length);
      expect(user.name).to.equal(userData3.name);
      expect(user.avatar).to.equal('https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/1dca3d82-9c91-4d2a-8fc9-4a565c531764');
      expect(user.name);
    }));

  it("doesn't fetch the avatar if one has already been provided", () => {
    userData3.avatar = 'https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/1dca3d82-9c91-4d2a-8fc9-4a565c531764';
    const currentCallCount = stub.callCount;
    return userlib.fetchAvatar(userData3).then(user => {
      expect(stub.callCount).to.equal(currentCallCount);
      expect(user).to.deep.equal(userData3);
    });
  });


});
