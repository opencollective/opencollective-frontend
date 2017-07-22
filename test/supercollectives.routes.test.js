import * as utils from '../test/utils';
import request from 'supertest-as-promised';
import { expect } from 'chai';
import app from '../server/index';

const application = utils.data('application');

describe('supercollectives.routes.test.js', () => {

  before(() => utils.loadDB('wwcode_test'));

  it('successfully get a supercollective with data', (done) => {
    request(app)
      .get(`/collectives/wwcode?api_key=${application.api_key}`)
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        const supercollective = res.body;
        const collectives = supercollective.superCollectiveData;
        expect(supercollective.yearlyIncome).to.equal(16119187);
        expect(collectives.length).to.eql(72);
        expect(collectives[0].backersCount).to.equal(21); // WWCode Austin
        expect(collectives[0].contributorsCount).to.equal(21);
        expect(collectives[2].githubContributorsCount).to.equal(10); // WWCode Portland

        let totalContributorsCount = 0;
        collectives.map(c => {
          totalContributorsCount += c.contributorsCount;
        })
        expect(supercollective.contributorsCount).to.equal(totalContributorsCount);

        done();
      })
  });

  it('successfully get contributors across all sub collectives', (done) => {
    request(app)
      .get(`/collectives/wwcode/users?api_key=${application.api_key}`)
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        expect(res.body.length).to.equal(164);
        done();
      });
  });
});