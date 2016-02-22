// const utils = require('../test/utils.js')();
const expect = require('chai').expect;
const libutils = require('../app/lib/utils');

const group = require('./mocks/data.json').group1;
const backer = { totalDonations: 5 };
const sponsor = { totalDonations: 500 };

describe("utils", () => {
  
  it("gets the right tier", () => {
    expect(libutils.getTier(backer, group.tiers)).to.equal('backer');
    expect(libutils.getTier(sponsor, group.tiers)).to.equal('sponsor');
  });
  
  it("returns backer as the default tier", () => {
    expect(libutils.getTier(backer, null)).to.equal('backer');
  });

  it("returns null if the member didn't make any donation", () => {
    expect(libutils.getTier({ totalDonations: null }, group.tiers)).to.equal(null);
  });
  
});