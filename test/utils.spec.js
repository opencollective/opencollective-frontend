// const utils = require('../test/utils.js')();
const expect = require('chai').expect;
const libutils = require('../app/lib/utils');

const group = require('./mocks/data.json').group1;
const backer = { totalDonations: 5 };
const sponsor = { totalDonations: 500 };

describe("utils", () => {
  
  it("gets the right tier", (done) => {
    expect(libutils.getTier(backer, group.tiers)).to.equal('backer');
    expect(libutils.getTier(sponsor, group.tiers)).to.equal('sponsor');
    done();
  })
  
});