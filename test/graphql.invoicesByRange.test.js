/** @module test/graphql.invoices.test
 *
 * This tests all the GraphQL API methods that interact with user
 * invoices. */

import sinon from 'sinon';
import { expect } from 'chai';
import moment from 'moment';

// The tests pass invalid ISO strings to moment and this gives an annoying deprecation warning.
moment.suppressDeprecationWarnings = true;

/* Test utilities */
import * as utils from './utils';
import * as store from './stores';

const startOctober2017ISOString = moment('2017-10-01').toISOString(true);
const startNovember2017ISOString = moment('2017-11-01').toISOString(true);

/** Create host, collective, payment method and make a donation
 *
 * As a bonus feature, this helper freezes time at `createdAt' so all
 * the objects created will have that date as their creation date.
 *
 * The payment method is always stripe for now.
 */
async function donate(user, currency, amount, createdAt, collective) {
  const timer = sinon.useFakeTimers(new Date(createdAt).getTime());
  try {
    await store.stripeConnectedAccount(collective.HostCollectiveId);
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount,
    });
  } finally {
    timer.restore();
  }
}

describe('graphql.invoicesByRange.test.js', () => {
  let xdamman;

  before(async () => {
    // First reset the test database
    await utils.resetTestDB();
    // Given a user and its collective
    const { user } = await store.newUser('xdamman');
    xdamman = user;
    // And given the collective (with their host)
    const { collective } = await store.newCollectiveWithHost('brusselstogether', 'EUR', 'EUR', 10);
    // And given some donations to that collective
    await donate(user, 'EUR', 1000, '2017-09-03 00:00', collective);
    await donate(user, 'EUR', 1000, '2017-10-05 00:00', collective);
    await donate(user, 'EUR', 500, '2017-10-25 00:00', collective);
    await donate(user, 'EUR', 500, '2017-11-05 00:00', collective);
    await donate(user, 'EUR', 500, '2017-11-25 00:00', collective);
  });

  describe('return transactions', () => {
    const query = `
        query InvoiceByDateRange($invoiceInputType: InvoiceInputType!) {
          InvoiceByDateRange(invoiceInputType: $invoiceInputType) {
            dateFrom
            dateTo
            totalAmount
            currency
            host {
              id
              slug
              location {
                name
                address
              }
            }
            fromCollective {
              id
              slug
              location {
                name
                address
              }
            }
            transactions {
              id
              amount
              description
            }
          }
        }
      `;

    it('returns an error if the dateTo is before dateFrom', async () => {
      const result = await utils.graphqlQuery(
        query,
        {
          invoiceInputType: {
            dateFrom: startNovember2017ISOString,
            dateTo: startOctober2017ISOString,
            collectiveSlug: 'brusselstogether-host',
            fromCollectiveSlug: 'xdamman',
          },
        },
        xdamman,
      );

      expect(result.errors[0].message).to.include('Invalid date');
    });

    it('returns an error if the date is an invalid ISO string', async () => {
      const result = await utils.graphqlQuery(
        query,
        {
          invoiceInputType: {
            dateFrom: startNovember2017ISOString,
            dateTo: 'notavalidtimestring',
            collectiveSlug: 'brusselstogether-host',
            fromCollectiveSlug: 'xdamman',
          },
        },
        xdamman,
      );

      expect(result.errors[0].message).to.include('Invalid date');
      const result2 = await utils.graphqlQuery(
        query,
        {
          invoiceInputType: {
            dateFrom: 'notavalidtimestring',
            dateTo: startOctober2017ISOString,
            collectiveSlug: 'brusselstogether-host',
            fromCollectiveSlug: 'xdamman',
          },
        },
        xdamman,
      );

      expect(result2.errors[0].message).to.include('Invalid date');
    });

    it('fails to return list of invoices for a given user if not logged in as that user', async () => {
      const result = await utils.graphqlQuery(query, {
        invoiceInputType: {
          dateFrom: startOctober2017ISOString,
          dateTo: startNovember2017ISOString,
          collectiveSlug: 'brusselstogether-host',
          fromCollectiveSlug: 'xdamman',
        },
      });

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.contain("You don't have permission to access invoices for this user");
    });

    it('returns invoice data for a given start and end date', async () => {
      const result = await utils.graphqlQuery(
        query,
        {
          invoiceInputType: {
            dateFrom: startOctober2017ISOString,
            dateTo: startNovember2017ISOString,
            collectiveSlug: 'brusselstogether-host',
            fromCollectiveSlug: 'xdamman',
          },
        },
        xdamman,
      );

      expect(result.errors).to.not.exist;
      const invoice = result.data.InvoiceByDateRange;
      expect(invoice.host.slug).to.equal('brusselstogether-host');
      expect(invoice.fromCollective.slug).to.equal('xdamman');
      expect(invoice.totalAmount).to.equal(1500);
      expect(invoice.currency).to.equal('EUR');
      expect(invoice.transactions).to.have.length(2);
      expect(invoice.dateFrom).to.equal(startOctober2017ISOString);
      expect(invoice.dateTo).to.equal(startNovember2017ISOString);
    });
  });
});
