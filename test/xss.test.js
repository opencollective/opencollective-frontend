import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import app from '../server/index';
import * as utils from '../test/utils';
import models from '../server/models';
import roles from '../server/constants/roles';
import middleware from '../server/middleware/sanitizer';

const application = utils.data('application');
const userData = utils.data('user3');
const userData2 = utils.data('user2');
const collectiveData = utils.data('collective2');

describe('XSS.test', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach(() => utils.resetTestDB());

  beforeEach('create a user', () => models.User.create(userData));

  beforeEach('create collective with user as first member', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(collectiveData, { users: [{ email: userData2.email, role: roles.HOST}]})
      })
      .expect(200)
      .end((e) => {
        expect(e).to.not.exist;
        done();
      });
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  describe('middleware sanitizer test', () => {
    let req, next;
    beforeEach(done => {
      req = {
        body: {
          test1: 'This is clean',
          test2: 'This <script>var isNot=true;</script> isnt!',
          test3: 'Im <b>technically</b> allowed.',
          test4: null,
          test5: 1,
          test6: '& This &lt;shouldnt&gt; work'
        }
      };
      next = sinon.spy();
      done();
    });

    it('should be defined', () => {
        expect(middleware).to.exist;
    });

    it('should be a function', () => {
        expect(middleware).to.be.a('function');
    });

    it('should sanitize XSS from body', () => {
        middleware()(req, {}, next);
        expect(req.body.test1).to.equal('This is clean');
        expect(req.body.test2).to.equal('This  isnt!');
        expect(req.body.test3).to.equal('Im technically allowed.');
        expect(req.body.test4).to.equal(null);
        expect(req.body.test5).to.equal(1);
        expect(req.body.test6).to.equal('& This  work');
    });

    it('should call next callback', () => {
        middleware()(req, {}, next);
        expect(next).calledOnce;
    });
  })

  describe('sanitizes user', () => {
    it('creates a user', (done) => {
      request(app)
        .post(`/users?api_key=${application.api_key}`)
        .send({
          user: {
            firstName: "<script>alert(\"hi\")</script>Janel",
            email: "aseem@opencollective.com",
          }
        })
        .end((err, res) => {
          const { body } = res;
          expect(body.email).to.equal('aseem@opencollective.com');
          expect(body.firstName).to.equal('Janel');
          done();
        });
    });
  });

});