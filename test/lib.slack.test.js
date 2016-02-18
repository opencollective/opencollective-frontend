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

  it (`formatActivity: ${constants.GROUP_TRANSANCTION_CREATED} donation`, function(){
    expect(slackLib.formatActivity(activitiesData[12])).to.equal('Woohoo! john@doe.com gave USD 10.42/month to <pubquiz.com|Pub quiz>!');
  });

  it (`formatActivity: ${constants.GROUP_TRANSANCTION_CREATED} expense`, function(){
    expect(slackLib.formatActivity(activitiesData[13])).to.equal('Hurray! john@doe.com submitted a undefined expense to Pub quiz: USD -12.98 for pizza!');
  });

  it (`formatActivity: ${constants.GROUP_TRANSANCTION_PAID} expense paid`, function(){
    expect(slackLib.formatActivity(activitiesData[14])).to.equal('Expense approved on Pub quiz: USD -12.98 for \'pizza\'');
  });

  it (`formatActivity: ${constants.USER_CREATED} all fields present`, function(){
    expect(slackLib.formatActivity(activitiesData[0])).to.equal('New user joined: john doe (john@doe.com) | <http://www.twitter.com/johndoe|@johndoe> | <opencollective.com|opencollective.com>');
  });

  it (`formatActivity: ${constants.USER_CREATED} only email present`, function(){
    expect(slackLib.formatActivity(activitiesData[1])).to.equal('New user joined: john@doe.com | <http://www.twitter.com/undefined|@undefined> | ');
  });

  it (`formatActivity: ${constants.WEBHOOK_STRIPE_RECEIVED}`, function(){
    expect(slackLib.formatActivity(activitiesData[15])).to.equal('New webhook.stripe.received');
  });

  it (`formatActivity: ${constants.SUBSCRIPTION_CONFIRMED}`, function(){
    expect(slackLib.formatActivity(activitiesData[16])).to.equal('Yay! Confirmed subscription of EUR 12.34/month from jussi@kuohujoki.fi to <blah.com|Blah>!');
  });

});
