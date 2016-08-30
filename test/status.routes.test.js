var app = require('../server/index');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

describe('status.routes.test.js', () => {

  describe('GET /status', () => {

    it('responds with status information', (done) => {
      request(app)
        .get('/status')
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.server.status).to.equal('up');
          // expect(res.body.server.env).to.equal(app.set('env'));
          expect(res.body).to.have.property('server');
          expect(res.body).to.have.property('node');
          expect(res.body).to.have.property('system');
          expect(res.body.system).to.have.property('hostname');
          done();
        });
    });

  });

});
