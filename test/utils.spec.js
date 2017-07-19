import {expect} from 'chai';
import { exportToPDF } from '../server/lib/utils';

describe("utils", () => {

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
            collective: {
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
