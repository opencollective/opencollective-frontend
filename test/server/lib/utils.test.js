import { expect, assert } from 'chai';
import { exportToPDF, sanitizeForLogs } from '../../../server/lib/utils';

describe('server/lib/utils', () => {
  it('sanitize for logs', () => {
    const obj = {
      user: {
        name: 'Xavier',
        email: 'xavier@gmail.com',
      },
      card: {
        expYear: 2022,
        token: 'tok_32112123',
      },
    };

    const res = sanitizeForLogs(obj);
    expect(res.user.name).to.equal(obj.user.name);
    expect(res.user.email).to.equal('(email obfuscated)');
    expect(res.card.token).to.equal('(token obfuscated)');
    expect(res.card.expYear).to.equal(obj.card.expYear);
  });

  it('exports PDF', done => {
    const data = {
      host: {
        name: 'WWCode',
        currency: 'USD',
      },
      expensesPerPage: [
        [
          {
            amount: 1000,
            currency: 'USD',
            description: 'Pizza',
            paymentProcessorFeeInHostCurrency: 5,
            collective: {
              slug: 'testcollective',
            },
            User: {
              name: 'Xavier',
              email: 'xavier@gmail.com',
            },
          },
        ],
      ],
    };
    exportToPDF('expenses', data).then(buffer => {
      try {
        assert.isAtLeast(buffer.length, 9000, 'PDF length should be at least 9000 bytes');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
