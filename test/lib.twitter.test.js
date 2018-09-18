import { expect } from 'chai';

import twitter from '../server/lib/twitter';

/**
 * The goal here is to test a host with collectives in multiple currencies
 * We use sanitized data from wwcode for this
 */
describe('lib.twitter.test.js', () => {
  describe('compile the tweet', () => {
    const data = {
      month: 'December',
      year: 2017,
      collectiveUrl: 'https://opencollective.com/preact',
      totalNewBackers: 2,
      totalActiveBackers: 82,
      totalAmountSpent: '$0',
      balance: '$1,200',
      totalAmountReceived: '$1,277',
      topBackersTwitterHandles: '@webflowapp, @dalmaer, @stickermule',
      newBackersTwitterHandles: '@bakkenbaeck, @mziehlke',
      topExpenseCategories: 'none',
    };

    it('with no amount spent', () => {
      const tweet = twitter.compileTweet('monthlyStats', data);
      expect(tweet).to.contain('we spent $0.');
    });

    it('with amount spent', () => {
      data.totalAmountSpent = '$542';
      data.topExpenseCategories = 'engineering and travel';
      const tweet = twitter.compileTweet('monthlyStats', data);
      expect(tweet).to.contain('we spent $542 on engineering and travel.');
    });

    it('with no new backer', () => {
      data.totalNewBackers = 0;
      data.newBackersTwitterHandles = '';
      const tweet = twitter.compileTweet('monthlyStats', data);
      expect(tweet).to.contain('no new backer joined');
    });

    it('with 1 new backer', () => {
      data.totalNewBackers = 1;
      data.newBackersTwitterHandles = '';
      const tweet = twitter.compileTweet('monthlyStats', data);
      expect(tweet).to.contain('one new backer joined');
    });

    it('with long new backers list', () => {
      data.totalNewBackers = 20;
      data.newBackersTwitterHandles =
        '@xdamman, @piamancini, @asood123, @opencollect, @storify';
      const tweet = twitter.compileTweet('monthlyStats', data);
      expect(tweet).to.not.contain('Thank you');
    });
  });
});
