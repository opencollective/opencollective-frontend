var clearbit = require('clearbit')('93890266fd5110a2f35ea61d31f484f7');
var Bluebird = require('bluebird');
var sinon = require('sinon');
var expect = require('chai').expect;

var stub = sinon.stub(clearbit.Enrichment, 'find', function(email) {
  return new Bluebird(function(resolve, reject) {
    var NotFound = new clearbit.Enrichment.NotFoundError();
    reject(NotFound);
  });
});

describe("clearbit", function() {

  it("catches the NotFound error", function(done) {

    clearbit.Enrichment
      .find({email:"xddddfsdf@gmail.com", stream: true})
      .catch(clearbit.Enrichment.NotFoundError, function(err) {
        expect(err).to.exist;
        expect(stub.called).to.be.true;
        done();
      })
      .catch(function(err) {
        console.log("unknown error");
      });

  });

});
