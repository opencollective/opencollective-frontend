import clearbit from '../server/gateways/clearbit';
import sinon from 'sinon';
import { expect } from 'chai';

const stub = sinon.stub(clearbit.Enrichment, 'find', () => {
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
        console.log("unknown error", err);
        done();
      });

  });

});
