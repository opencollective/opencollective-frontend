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

  it (`formatMessage: ${constants.GROUP_TRANSACTION_CREATED} donation`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[12], true);
    expect(actual).to.equal('New Donation: john@doe.com gave USD 10.42 to <pubquiz.com|Pub quiz>!');
  });

  it (`formatMessage: ${constants.GROUP_TRANSACTION_CREATED} expense`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[13], true);
    expect(actual).to.equal('New Expense: john@doe.com submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
  });

  it (`formatMessage: ${constants.GROUP_TRANSACTION_PAID} expense paid`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[14], true);
    expect(actual).to.equal('Expense approved on Pub quiz: USD -12.98 for \'pizza\'');
  });

  it (`formatMessage: ${constants.USER_CREATED} all fields present`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[0], true);
    expect(actual).to.equal('New user joined: john doe (john@doe.com) | <http://www.twitter.com/johndoe|@johndoe> | <opencollective.com|opencollective.com>');
  });

  it (`formatMessage: ${constants.USER_CREATED} only email present`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[1], true);
    expect(actual).to.equal('New user joined: john@doe.com | <http://www.twitter.com/undefined|@undefined> | ');
  });

  it (`formatMessage: ${constants.WEBHOOK_STRIPE_RECEIVED}`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[15], true);
    expect(actual).to.equal('Stripe event received: invoice.payment_succeeded');
  });

  it (`formatMessage: ${constants.SUBSCRIPTION_CONFIRMED}`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[16], true);
    expect(actual).to.equal('New subscription confirmed: EUR 12.34 from jussi@kuohujoki.fi to <blah.com|Blah>!');
  });

  it (`formatMessage: ${constants.SUBSCRIPTION_CONFIRMED} with month interval`, function(){
    var actual = activitiesLib.formatMessage(activitiesData[17], true);
    expect(actual).to.equal('New subscription confirmed: EUR 12.34/month from jussi@kuohujoki.fi to <blah.com|Blah>!');
  });

});
