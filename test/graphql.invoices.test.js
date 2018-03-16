import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';

describe('graphql.invoices.test.js', () => {

  let xdamman;

  before(() => utils.loadDB("opencollective_dvl"));
  before(async () => {
    xdamman = await models.User.findById(2);
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
      const result = await utils.graphqlQuery(query, { fromCollectiveSlug: "xdamman" });
      result.errors && console.error(result.errors[0]);
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
      const result = await utils.graphqlQuery(query, { fromCollectiveSlug: "xdamman" }, xdamman);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const invoices = result.data.allInvoices;
      expect(invoices).to.have.length(23);
      expect(invoices[0].year).to.equal(2017);
      expect(invoices[0].month).to.equal(11);
      expect(invoices[0].totalAmount).to.equal(1000);
      expect(invoices[0].currency).to.equal("EUR");
      expect(invoices[0].host.slug).to.equal("brusselstogether");
      expect(invoices[0].fromCollective.slug).to.equal("xdamman");
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
      const result = await utils.graphqlQuery(query, { invoiceSlug: "201710-brusselstogether-xdamman" }, xdamman);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const invoice = result.data.Invoice;
      expect(invoice.host.slug).to.equal("brusselstogether");
      expect(invoice.fromCollective.slug).to.equal("xdamman");
      expect(invoice.totalAmount).to.equal(1500);
      expect(invoice.currency).to.equal("EUR");
      expect(invoice.transactions).to.have.length(2);
    });

  });
});
