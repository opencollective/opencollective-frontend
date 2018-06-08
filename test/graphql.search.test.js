import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

// class containing 'search' method to stub
import Index from 'algoliasearch/src/Index';

import * as utils from './utils';

describe('graphql.search.test.js', () => {
  let sandbox;
  const hits = [{
    id: 83,
    name: 'Open Source Collective',
    description: 'This is the Open Source Collective. Consider supporting the open source projects directly or become a member of the Open Source Collective and support all projects. ',
    currency: 'USD',
    slug: 'test-collective',
    mission: 'test mission',
    tags: ['open', 'test', 'collective'],
    locationName: 'Testland',
    image: '',
    balance: 1300,
    yearlyBudget: 3600,
    backersCount: 130
  }];
  const nbHits = 10;

  before(async () => {
    await utils.loadDB('opencollective_dvl');
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    sandbox.stub(Index.prototype, 'search');
    Index.prototype.search.returns(Promise.resolve({ hits, nbHits }));
  });

  afterEach(() => sandbox.restore());

  it('returns list of CollectiveSearch types', async () => {
    const query = `
    query CollectiveSearch($term: String!) {
      search(term: $term) {
        collectives {
          id
        }
      }
    }
    `;

    const result = await utils.graphqlQuery(query, { term: 'open' });

    expect(Index.prototype.search.firstCall.calledWith({
      query: 'open',
      length: 20,
      offset: 0,
    })).to.be.true;
    expect(result.data.search).to.deep.equal({ collectives: [{ id: hits[0].id }]});
  });

  it('accepts limit and offset arguments', async () => {
    const query = `
    query CollectiveSearch($term: String!, $limit: Int!, $offset: Int!) {
      search(term: $term, limit: $limit, offset: $offset) {
        collectives {
          id
          name
          description
        }
        total
        limit
        offset
      }
    }
    `;

    const result = await utils.graphqlQuery(query, { term: 'open', limit: 20, offset: 10 });

    expect(Index.prototype.search.firstCall.calledWith({
      query: 'open',
      length: 20,
      offset: 10,
    })).to.be.true;
    expect(result.data.search)
    .to.deep.equal({
      collectives: [{
        id: hits[0].id,
        name: hits[0].name,
        description: hits[0].description,
      }],
      total: nbHits,
      limit: 20,
      offset: 10,
    });
  });
});
