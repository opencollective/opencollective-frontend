import app from '../../../server/index';
import { expect } from 'chai';
import request from 'supertest';

describe('server/routes/status', () => {
  describe('GET /status', () => {
    it('responds with status information', done => {
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
