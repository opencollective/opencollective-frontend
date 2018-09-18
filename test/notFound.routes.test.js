import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';

const application = utils.data('application');

describe('notFound.routes.test.js', () => {
  describe('WHEN calling unknown route', () => {
    let req;

    beforeEach(() => {
      req = request(app).get(`/blablabla?api_key=${application.api_key}`);
    });

    it('THEN returns 404', () =>
      req
        .expect(404)
        .toPromise()
        .tap(res => expect(res.error.text).to.equal('Not Found')));
  });
});
