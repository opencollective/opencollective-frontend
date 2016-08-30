const app = require('../server/index');
const expect = require('chai').expect;
const request = require('supertest-as-promised');

describe('notFound.routes.test.js', () => {

  describe('WHEN calling unknown route', () => {

    var req;

    beforeEach(() => {
      req = request(app)
        .get('/blablabla?api_token=yabada');
    });

    it("THEN returns 404", () =>
      req.expect(404)
        .toPromise()
        .tap(res => expect(res.error.text).to.equal('Not Found')));
  });
});
