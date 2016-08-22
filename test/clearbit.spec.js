const config = require('config');
const clearbit = require('clearbit')(config.clearbit);
const sinon = require('sinon');
const expect = require('chai').expect;

const stub = sinon.stub(clearbit.Enrichment, 'find', (email) => {
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
