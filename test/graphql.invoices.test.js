/** @module test/graphql.invoices.test
 *
 * This tests all the GraphQL API methods that interact with user
 * invoices. */

import sinon from 'sinon';
import { expect } from 'chai';

/* Test utilities */
import * as utils from './utils';
import * as store from './stores';

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

describe('graphql.invoices.test.js', () => {
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
    it('fails to return list of invoices for a given user if not logged in as that user', async () => {
      const query = `
        query allInvoices($fromCollectiveSlug: String!) {
          allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
            year
            month
            host {
              id
              slug
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, {
        fromCollectiveSlug: 'xdamman',
      });
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.contain("You don't have permission to access invoices for this user");
    });

    it('returns list of invoices for a given user', async () => {
      const query = `
        query allInvoices($fromCollectiveSlug: String!) {
          allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
            year
            month
            totalAmount
            currency
            host {
              id
              slug
            }
            fromCollective {
              id
              slug
            }
          }
        }
      `;
      const result = await utils.graphqlQuery(query, { fromCollectiveSlug: 'xdamman' }, xdamman);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const invoices = result.data.allInvoices;
      expect(invoices).to.have.length(3);
      expect(invoices[0].year).to.equal(2017);
      expect(invoices[0].month).to.equal(11);
      expect(invoices[0].totalAmount).to.equal(1000);
      expect(invoices[0].currency).to.equal('EUR');
      expect(invoices[0].host.slug).to.equal('brusselstogether-host');
      expect(invoices[0].fromCollective.slug).to.equal('xdamman');
    });

    it('returns invoice data for a given year/month', async () => {
      const query = `
        query Invoice($invoiceSlug: String!) {
          Invoice(invoiceSlug: $invoiceSlug) {
            year
            month
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
      const result = await utils.graphqlQuery(query, { invoiceSlug: '201710.brusselstogether-host.xdamman' }, xdamman);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const invoice = result.data.Invoice;
      expect(invoice.host.slug).to.equal('brusselstogether-host');
      expect(invoice.fromCollective.slug).to.equal('xdamman');
      expect(invoice.totalAmount).to.equal(1500);
      expect(invoice.currency).to.equal('EUR');
      expect(invoice.transactions).to.have.length(2);
    });
  });
});
