const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');
const Slack = require('node-slack');
const activitiesLib = require('../server/lib/activities');

const slackLib = require('../server/lib/slack');

describe('lib/slack', () => {

  describe('calling postMessage', () => {

    const message = "lorem ipsum";
    const basePayload = {
      text: message,
      username: 'OpenCollective Activity Bot',
      icon_url: 'https://opencollective.com/favicon.ico',
      attachments: [],
      channel: '#activity_test'
    };

    it('with message succeeds', done => {
      expectPayload(basePayload);

      callSlackLib(done, message);
    });

    it('with attachment succeeds', done => {
      const attachments = ["att1", "att2"];

      expectPayload(_.extend({}, basePayload, { attachments }));

      callSlackLib(done, message, { attachments });
    });

    it('with channel succeeds', done => {
      const channel = "kewl channel";

      expectPayload(_.extend({}, basePayload, { channel }));

      callSlackLib(done, message, { channel });
    });
  });

  describe('calling postActivity', () => {

    var formatMessageStub, postMessageStub;
    const activity = "my activity";
    const formattedMessage = "my formatted activity";

    beforeEach(() => {
      formatMessageStub = sinon.stub(activitiesLib, "formatMessage");
      postMessageStub = sinon.stub(slackLib, "postMessage");
    });

    afterEach(() => {
      formatMessageStub.restore();
      postMessageStub.restore();
    });

    it('with activity succeeds', done => {

      formatMessageStub
        .withArgs(activity, true)
        .returns(formattedMessage);

      const expected = postMessageStub
        .withArgs(formattedMessage, { attachments: [] });

      slackLib.postActivity(activity);

      expect(expected.called).to.be.ok;
      done();
    });

    it('with options keeps the options', done => {
      const options = { option1: "option1" };

      formatMessageStub
        .withArgs(activity, true)
        .returns(formattedMessage);

      const expected = postMessageStub
        .withArgs(formattedMessage, _.extend({}, { attachments: [] }, options));

      slackLib.postActivity(activity, options);

      expect(expected.called).to.be.ok;
      done();
    });

    it('with WEBHOOK_STRIPE_RECEIVED activity creates the appropriate attachment', done => {
      const activity = {
        type: 'webhook.stripe.received',
        data: 'activity data'
      };
      const formattedAttachmentText = "formatted attachment text";
      const formatAttachmentStub = sinon
        .stub(activitiesLib, "formatAttachment");

      formatMessageStub
        .withArgs(activity, true)
        .returns(formattedMessage);

      formatAttachmentStub
        .withArgs(activity.data)
        .returns(formattedAttachmentText);

      const expected = postMessageStub
        .withArgs(formattedMessage, {
          attachments: [{
            title: 'Data',
            color: 'good',
            text: formattedAttachmentText
          }]
        });

      slackLib.postActivity(activity);

      expect(expected.called).to.be.ok;
      formatAttachmentStub.restore();
      done();
    });
  });
});

function expectPayload(expectedPayload) {
  Slack.prototype.send = (actualPayload, cb) => {
    expect(actualPayload).to.deep.equal(expectedPayload);
    cb();
  };
}

function callSlackLib(done, msg, options) {
  slackLib
    .postMessage(msg, options)
    .then(done)
    .catch(done);
}
