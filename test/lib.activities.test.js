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

    it (`formatMessageForPrivateChannel: ${constants.GROUP_TRANSACTION_CREATED} donation`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[12], true);
      expect(actual).to.equal('New Donation: john@doe.com gave USD 10.42 to <pubquiz.com|Pub quiz>!');
    });

    it (`formatMessageForPrivateChannel: ${constants.GROUP_TRANSACTION_CREATED} expense`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[13], true);
      expect(actual).to.equal('New Expense: john@doe.com submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
    });

    it (`formatMessageForPrivateChannel: ${constants.GROUP_TRANSACTION_PAID} expense paid`, () => {
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[14], true);
      expect(actual).to.equal('Expense approved on Pub quiz: USD -12.98 for \'pizza\'');
    });

    it (`formatMessageForPrivateChannel: ${constants.USER_CREATED} all fields present`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[0], true);
      expect(actual).to.equal('New user joined: john doe (john@doe.com) | <http://www.twitter.com/johndoe|@johndoe> | <opencollective.com|opencollective.com>');
    });

    it (`formatMessageForPrivateChannel: ${constants.USER_CREATED} only email present`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[1], true);
      expect(actual).to.equal('New user joined: john@doe.com | <http://www.twitter.com/undefined|@undefined> | ');
    });

    it (`formatMessageForPrivateChannel: ${constants.WEBHOOK_STRIPE_RECEIVED}`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[15], true);
      expect(actual).to.equal('Stripe event received: invoice.payment_succeeded');
    });

    it (`formatMessageForPrivateChannel: ${constants.SUBSCRIPTION_CONFIRMED}`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[16], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34 from jussi@kuohujoki.fi to <blah.com|Blah>!');
    });

    it (`formatMessageForPrivateChannel: ${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[17], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34/month from jussi@kuohujoki.fi to <blah.com|Blah>!');
    });

    it (`formatMessageForPrivateChannel: ${constants.GROUP_CREATED}`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[18], true);
      expect(actual).to.equal('New group created: <blah.com|Blah> by jussi@kuohujoki.fi');
    });

    it (`formatMessageForPrivateChannel: ${constants.GROUP_USER_ADDED}`, () =>{
      var actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[19], true);
      expect(actual).to.equal('New user http://avatar.githubusercontent.com/asood123 (UserId: 2) added to group: <blah.com|Blah>');
    });
  });

  describe('formatMessageForPublicChannel', () => {

    it (`formatMessageForPublicChannel: ${constants.GROUP_TRANSACTION_CREATED} donation`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[12], true);
      expect(actual).to.equal('New Donation: someone gave USD 10.42 to <pubquiz.com|Pub quiz>!');
    });

    it (`formatMessageForPublicChannel: ${constants.GROUP_TRANSACTION_CREATED} expense`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[13], true);
      expect(actual).to.equal('New Expense: someone submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
    });

    it (`formatMessageForPublicChannel: ${constants.GROUP_TRANSACTION_PAID} expense paid`, () => {
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[14], true);
      expect(actual).to.equal('Expense approved on Pub quiz: USD -12.98 for \'pizza\'');
    });

    it (`formatMessageForPublicChannel: ${constants.SUBSCRIPTION_CONFIRMED}`, () =>{
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[16], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34 from someone to <blah.com|Blah>!');
    });

    it (`formatMessageForPublicChannel: ${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () =>{
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[17], true);
      expect(actual).to.equal('New subscription confirmed: EUR 12.34/month from someone to <blah.com|Blah>!');
    });

    it (`formatMessageForPublicChannel: ${constants.GROUP_CREATED}`, () =>{
      var actual = activitiesLib.formatMessageForPublicChannel(activitiesData[18], true);
      expect(actual).to.equal('New group created: <blah.com|Blah> by someone');
    });

  });
})


