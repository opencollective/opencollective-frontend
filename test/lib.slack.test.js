/**
 * Dependencies.
 */
const expect = require('chai').expect;
const utils = require('../test/utils.js')();
const activitiesData = utils.data('activities1').activities;
const constants = require('../app/constants/activities');
const slackLib = require('../app/lib/slack');

/**
 * Tests.
 */
describe('lib.slack.test.js', function() {

  it (`formatActivity: ${constants.GROUP_TRANSACTION_CREATED} donation`, function(){
    obj = slackLib.formatActivity(activitiesData[12]);
    expect(obj.msg).to.equal('Woohoo! john@doe.com gave USD 10.42 to <pubquiz.com|Pub quiz>!');
  });

  it (`formatActivity: ${constants.GROUP_TRANSACTION_CREATED} expense`, function(){
    obj = slackLib.formatActivity(activitiesData[13]);
    expect(obj.msg).to.equal('Hurray! john@doe.com submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
  });

  it (`formatActivity: ${constants.GROUP_TRANSACTION_PAID} expense paid`, function(){
    obj = slackLib.formatActivity(activitiesData[14]);
    expect(obj.msg).to.equal('Expense approved on Pub quiz: USD -12.98 for \'pizza\'');
  });

  it (`formatActivity: ${constants.USER_CREATED} all fields present`, function(){
    obj = slackLib.formatActivity(activitiesData[0]);
    expect(obj.msg).to.equal('New user joined: john doe (john@doe.com) | <http://www.twitter.com/johndoe|@johndoe> | <opencollective.com|opencollective.com>');
  });

  it (`formatActivity: ${constants.USER_CREATED} only email present`, function(){
    obj = slackLib.formatActivity(activitiesData[1]);
    expect(obj.msg).to.equal('New user joined: john@doe.com | <http://www.twitter.com/undefined|@undefined> | ');
  });

  it (`formatActivity: ${constants.WEBHOOK_STRIPE_RECEIVED}`, function(){
    obj = slackLib.formatActivity(activitiesData[15]);
    expect(obj.msg).to.equal('Stripe event received: invoice.payment_succeeded')
    expect(obj.attachmentArray).to.deep.equal(
      [{"text": "event.type: invoice.payment_succeeded",
        "title": "Data",
        "color": "good"
      }]);
  });

  it (`formatActivity: ${constants.SUBSCRIPTION_CONFIRMED}`, function(){
    obj = slackLib.formatActivity(activitiesData[16]);
    expect(obj.msg).to.equal('Yay! Confirmed subscription of EUR 12.34 from jussi@kuohujoki.fi to <blah.com|Blah>!');
  });

  it (`formatActivity: ${constants.SUBSCRIPTION_CONFIRMED} with month interval`, function(){
    obj = slackLib.formatActivity(activitiesData[17]);
    expect(obj.msg).to.equal('Yay! Confirmed subscription of EUR 12.34/month from jussi@kuohujoki.fi to <blah.com|Blah>!');
  });

});
