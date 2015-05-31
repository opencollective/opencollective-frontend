var app = require('../index');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

describe('status.routes.test.js', function() {

  describe('GET /status', function() {

    it('responds with status', function(done) {
      request(app)
        .get('/status')
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body.status).to.equal('up');
          done();
        });
    });

    it('responds with status information', function(done) {
      request(app)
        .get('/status?info=1')
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body.status).to.equal('up');
          expect(res.body.env).to.equal('test');
          expect(res.body).to.have.property('started_at');
          expect(res.body).to.have.property('node');
          expect(res.body).to.have.property('system');
          expect(res.body).to.have.property('hostname');
          expect(res.body).to.have.property('connections');
          done();
        });
    });

  });

});
