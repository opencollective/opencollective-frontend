import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';

describe('graphql.collective.test.js', () => {
  let host, collective;

  describe("read", () => {

    before(() => utils.loadDB('opencollective_dvl'));  
    before(() => models.Collective.findOne({ where: { slug: 'opensource' }}).then(c => host = c));
    before(() => models.Collective.findOne({ where: { slug: 'railsgirlsatl' }}).then(c => collective = c));
    
    const query = `
    query allExpenses($CollectiveId: Int!, $limit: Int) {
      allExpenses(CollectiveId: $CollectiveId, limit: $limit) {
        id
        description
        amount
        category
        user {
          id
          email
          paypalEmail
          collective {
            id
            slug
          }
        }
        collective {
          id
          slug
        }
      }
    }`;
    
    it('fails if collective not found', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: 999999 });
      result.errors && console.error(result.errors);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('Collective not found');
    })
    
    it('gets the latest expenses from one collective', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: collective.id, limit: 5 });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([ 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl', 'railsgirlsatl' ]);
    });
    
    it('gets the latest expenses from all the hosted collectives', async () => {
      const result = await utils.graphqlQuery(query, { CollectiveId: host.id, limit: 5 });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const expenses = result.data.allExpenses;
      expect(expenses).to.have.length(5);
      expect(expenses.map(e => e.collective.slug)).to.deep.equal([ 'apex', 'railsgirlsatl', 'apex', 'opensource', 'railsgirlsatl' ]);
    });
  });
});