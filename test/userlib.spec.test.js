
var expect = require('chai').expect;
var utils = require('../test/utils.js')();
var userlib = require('../server/lib/userlib.js');
var sinon = require('sinon');
var Bluebird = require('bluebird');

/**
 * Variables.
 */
var userData1 = utils.data('user1');
var userData3 = utils.data('user3');

var mock = require('./mocks/clearbit.json');

describe("userlib", () => {
  
  var sandbox, stub;
  beforeEach(() => {
    userlib.memory = {};
    sandbox = sinon.sandbox.create();
    stub = sandbox.stub(userlib.clearbit.Enrichment, 'find', (opts) => {
      return new Bluebird((resolve, reject) => {
        switch(opts.email) {
          case userData1.email:
            var NotFound = new userlib.clearbit.Enrichment.NotFoundError(' NotFound');
            reject(NotFound);
            break;
          case userData3.email:
            return resolve(mock);
          default:
            return reject(new Error());
        }
      });
    });
  });

  afterEach(() => sandbox.restore() );

  it("doesn't call clearbit if email invalid", (done) => {
    userlib.fetchAvatar({email: "email.com"}, (err, user) => {
      expect(err).to.exist;
      expect(user.avatar).to.be.undefined;
      expect(user.email).to.equal("email.com");
      expect(stub.called).to.be.false;
      done();
    });
  });

  it("can't fetch the avatar of an unknown email", (done) => {
    userlib.fetchAvatar(userData1, (err, user) => {
      expect(err).to.be.an.instanceof(userlib.clearbit.Enrichment.NotFoundError);
      expect(userlib.memory).to.have.property(userData1.email);
      expect(stub.callCount).to.equal(1);
      expect(user).to.deep.equal(userData1);
      done();
    });
  });

  it("only calls clearbit server once for an email not found", (done) => {
    userlib.fetchAvatar(userData1, (err, user) => {
      userlib.fetchAvatar(userData1, (err, user) => {
        expect(stub.callCount).to.equal(1);
        expect(err).to.be.null;
        expect(user.avatar).to.be.undefined;
        expect(user).to.deep.equal(userData1);
        done();
      });
    });
  });

  it("fetches the avatar of a known email and only updates the user.avatar", (done) => {
    userlib.fetchAvatar(userData3, (err, user) => {
      expect(err).to.not.exist;
      expect(Object.keys(user).length).to.equal(Object.keys(userData3).length);
      expect(user.name).to.equal(userData3.name);
      expect(user.avatar).to.equal('https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/1dca3d82-9c91-4d2a-8fc9-4a565c531764');
      expect(user.name)
      done();
    });
  });

  it("doesn't fetch the avatar if one has already been provided", (done) => {
    userData3.avatar = 'https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/1dca3d82-9c91-4d2a-8fc9-4a565c531764';
    var currentCallCount = stub.callCount;
    userlib.fetchAvatar(userData3, (err, user) => {
      expect(stub.callCount).to.equal(currentCallCount);
      expect(user).to.deep.equal(userData3);
      done();
    });
  });


});
