import {expect} from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

const {
  Collective,
  User
} = models;

describe('Collective model', () => {

  let collective = {};

  const collectiveData = {
    slug: 'tipbox',
    name: 'tipbox',
    currency: 'USD',
    tags: ['#brusselstogether'],
    tiers: [
      { 
        name: 'backer',
        range: [2, 100],
        interval: 'monthly'
      },
      { 
        name: 'sponsor',
        range: [100, 100000],
        interval: 'yearly'
      }
    ]
  };

  const users = [{
    username: 'xdamman',
    email: 'xdamman@opencollective.com'
  },{
    username: 'piamancini',
    email: 'pia@opencollective.com'
  }];


  before(() => utils.resetTestDB());

  before(() => Collective.create(collectiveData)
    .then(c => collective = c)
    .then(() => User.createMany(users))
    .then(() => models.Tier.createMany([
      { type: 'TICKET', name: 'ticket 1', amount: 1000 },
      { type: 'TIER', name: 'backer', amount: 500, interval: 'month' },
      { type: 'TIER', name: 'sponsor', amount: 1000000, interval: 'year' },
      { type: 'TIER', name: 'donor', slug: 'donors' }
    ], { CollectiveId: collective.id })))

  it('a one time donation returns the donor tier', () => models.Tier.getOrFind({ amount: 1100, CollectiveId: collective.id })
    .then(tier => {
      expect(tier).to.exist;
      expect(tier.type).to.equal('TIER');
      expect(tier.name).to.equal('donor');
    }))

    it('a recurring donation returns the backer tier', () => models.Tier.getOrFind({ amount: 1100, interval: 'month', CollectiveId: collective.id })
    .then(tier => {
      expect(tier).to.exist;
      expect(tier.type).to.equal('TIER');
      expect(tier.name).to.equal('backer');
    }))

  it('if tier id provided, returns the tier', () => models.Tier.getOrFind({ id: 1, CollectiveId: collective.id })
    .then(tier => {
      expect(tier).to.exist;
      expect(tier.id).to.equal(1);
    }))
    
});