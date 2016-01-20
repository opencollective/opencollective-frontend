var config = require('config');
var clearbit = require('clearbit')(config.clearbit);
var sinon = require('sinon');
var expect = require('chai').expect;

var stub = sinon.stub(clearbit.Enrichment, 'find', (email) => {
  return Promise.reject(new clearbit.Enrichment.NotFoundError());
});

describe("clearbit", () => {

  it("catches the NotFound error", (done) => {

    clearbit.Enrichment
      .find({email:"xddddfsdf@gmail.com", stream: true})
      .catch(clearbit.Enrichment.NotFoundError, (err) => {
        expect(err).to.exist;
        expect(stub.called).to.be.true;
        done();
      })
      .catch((err) => {
        console.log("unknown error");
        done();
      });

  });

});
