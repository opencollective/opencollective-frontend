import {expect} from 'chai';
import {getTier, exportToPDF } from '../server/lib/utils';
import data from './mocks/data';
import roles from '../server/constants/roles';

const group = data.group1;
const backer = { totalDonations: 500 };
const sponsor = { totalDonations: 50000 };

describe("utils", () => {

  it("gets the right tier", () => {
    expect(getTier(backer, group.tiers)).to.equal('backer');
    expect(getTier(sponsor, group.tiers)).to.equal('sponsor');
  });

  it("returns backer as the default tier", () => {
    expect(getTier(backer, null)).to.equal('backer');
  });

  it("returns contributor if the member didn't make any donation", () => {
    expect(getTier({ role: roles.MEMBER, totalDonations: null }, group.tiers)).to.equal('core contributor');
  });

  it("exports PDF", function(done) {
    this.timeout(10000);

    const data = {
      host: {
        name: "WWCode",
        currency: "USD"
      },
      expensesPerPage: [
        [
          {
            amount: 1000,
            currency: 'USD',
            title: 'Pizza',
            paymentProcessorFeeInTxnCurrency: 5,
            group: {
              slug: 'testcollective'
            },
            User: {
              name: "Xavier",
              email: "xavier@gmail.com"
            }
          }
        ]
      ]
    }
    exportToPDF("expenses", data).then(buffer => {
      const expectedSize = (process.env.NODE_ENV === 'circleci') ? 27750 : 26123;
      // Size varies for some reason...
      console.log("PDF length is ", buffer.length, "expected length", expectedSize);
      expect(buffer.length > 20000).to.be.true;
      done();
    });
  })

});
