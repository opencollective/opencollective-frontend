// const utils = require('../test/utils.js')();
const expect = require('chai').expect;
const libutils = require('../server/lib/utils');

const group = require('./mocks/data.json').group1;
const backer = { totalDonations: 5 };
const sponsor = { totalDonations: 500 };

const roles = require('../server/constants/roles');

describe("utils", () => {
  
  it("gets the right tier", () => {
    expect(libutils.getTier(backer, group.tiers)).to.equal('backer');
    expect(libutils.getTier(sponsor, group.tiers)).to.equal('sponsor');
  });
  
  it("returns backer as the default tier", () => {
    expect(libutils.getTier(backer, null)).to.equal('backer');
  });

  it("returns contributor if the member didn't make any donation", () => {
    expect(libutils.getTier({ role: roles.MEMBER, totalDonations: null }, group.tiers)).to.equal('contributor');
  });
  
});
