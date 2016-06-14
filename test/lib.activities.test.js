/**
 * Dependencies.
 */
const expect = require('chai').expect;
const utils = require('../test/utils.js')();
const activitiesData = utils.data('activities1').activities;
const constants = require('../server/constants/activities');
const activitiesLib = require('../server/lib/activities');

/**
 * Tests.
 */
describe('lib.activities.test.js', () => {

  describe('formatMessageForPrivateChannel', () => {

    it (`${constants.GROUP_TRANSACTION_CREATED} donation`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[12], true);
      expect(actual).to.equal('New Donation: someone (john@doe.com) gave USD 10.42 to <pubquiz.com|Pub quiz>!');
    });

    it (`${constants.GROUP_TRANSACTION_PAID} expense paid`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[14], true);
      expect(actual).to.equal('Expense paid on Pub quiz: USD -12.98 for \'pizza\'');
    });

    it (`${constants.USER_CREATED} all fields present`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[0], true);
      expect(actual).to.equal('New user joined: <http://www.twitter.com/johndoe|john doe> (john@doe.com)');
    });

    it (`${constants.USER_CREATED} only email present`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[1], true);
      expect(actual).to.equal('New user joined: someone (john@doe.com)');
    });

    it (constants.WEBHOOK_STRIPE_RECEIVED, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[15], true);
      expect(actual).to.equal('Stripe event received: invoice.payment_succeeded');
    });

    it (constants.SUBSCRIPTION_CONFIRMED, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[16], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34 from someone (jussi@kuohujoki.fi) to <blah.com|Blah>!');
    });

    it (`${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[17], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34/month from someone (jussi@kuohujoki.fi) to <blah.com|Blah>!');
    });

    it (constants.GROUP_CREATED, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[18], true);
      expect(actual).to.equal('New group created: <blah.com|Blah> by someone (jussi@kuohujoki.fi)');
    });

    it (constants.GROUP_USER_ADDED, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[19], true);
      expect(actual).to.equal('New user: someone (UserId: 2) added to group: <blah.com|Blah>');
    });

    it (`${constants.GROUP_EXPENSE_CREATED}`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[20], true);
      expect(actual).to.equal('New Expense: someone submitted an expense to <blah.com|Blah>: EUR 0.1234 for for pizza!');
    });

    it (`${constants.GROUP_EXPENSE_REJECTED}`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[21], true);
      expect(actual).to.equal('Expense rejected: EUR 0.1234 for for pizza in <blah.com|Blah> by userId: 2!');
    });

    it (`${constants.GROUP_EXPENSE_APPROVED}`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[22], true);
      expect(actual).to.equal('Expense approved: EUR 0.1234 for for pizza in <blah.com|Blah> by userId: 2!');
    });

  });

  describe('formatMessageForPublicChannel', () => {

    it (`${constants.GROUP_TRANSACTION_CREATED} donation`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[12], true);
      expect(actual).to.equal('New Donation: someone gave USD 10.42 to <pubquiz.com|Pub quiz>!');
    });

    it (`${constants.GROUP_TRANSACTION_CREATED} expense`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[13], true);
      expect(actual).to.equal('New Expense: someone submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
    });

    it (`${constants.GROUP_TRANSACTION_PAID} expense paid`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[14], true);
      expect(actual).to.equal('Expense paid on Pub quiz: USD -12.98 for \'pizza\'');
    });

    it (constants.SUBSCRIPTION_CONFIRMED, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[16], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34 from someone to <blah.com|Blah>!');
    });

    it (`${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[17], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34/month from someone to <blah.com|Blah>!');
    });

    it (constants.GROUP_CREATED, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[18], true);
      expect(actual).to.equal('New group created: <blah.com|Blah> by someone');
    });

    it (`${constants.GROUP_EXPENSE_CREATED}`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[20], true);
      expect(actual).to.equal('New Expense: someone submitted an expense to <blah.com|Blah>: EUR 0.1234 for for pizza!');
    });

    it (`${constants.GROUP_EXPENSE_REJECTED}`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[21], true);
      expect(actual).to.equal('Expense rejected: EUR 0.1234 for for pizza in <blah.com|Blah>!');
    });

    it (`${constants.GROUP_EXPENSE_APPROVED}`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[22], true);
      expect(actual).to.equal('Expense approved: EUR 0.1234 for for pizza in <blah.com|Blah>!');
    });

  });
})


