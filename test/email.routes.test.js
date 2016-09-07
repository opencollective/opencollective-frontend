import {expect} from 'chai';
import app from '../server/index';
import request from 'supertest-as-promised';
import Promise from 'bluebird';
import sinon from 'sinon';
import nock from 'nock';
import models from '../server/models';
import emailLib from '../server/lib/email';
import MailgunNock from './mocks/mailgun.nock.js';
import webhookBody from './mocks/mailgun.webhook.payload';
import * as utils from '../test/utils';

const {
  User,
  Group
} = models;

const usersData = [
  {
    name: 'Xavier Damman',
    email: 'xdamman+test@gmail.com',
    role: 'MEMBER',
    lists: ['mailinglist.members','mailinglist.info']
  },
  {
    name: 'Aseem Sood',
    email: 'asood123+test@gmail.com',
    role: 'MEMBER'
  },
  {
    name: 'Pia Mancini',
    email: 'pia+test@opencollective.com',
    role: 'BACKER',
    lists: ['mailinglist.backers']
  },
  {
    name: 'github',
    email: 'github+test@opencollective.com',
    role: 'BACKER',
    lists: ['mailinglist.backers']
  }
];

const groupData = {
  slug: 'testcollective',
  name: 'Test Collective',
  settings: {}
};

let group, users = [];

describe("email.routes.test", () => {

  let sandbox;

  before(() => utils.cleanAllDb());

  after(() => nock.cleanAll());

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    MailgunNock();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
  });

  before((done) => {

    Group.create(groupData)
      .tap(g => group = g )
      .then(() => User.createMany(usersData))
      .tap(users => {
        return Promise.map(users, (user, index) => {
          return group.addUserWithRole(user, usersData[index].role);
        });
      })
      .tap(usersRows => {
        users = usersRows;
        return Promise.map(usersRows, (user, index) => {
          const lists = usersData[index].lists || [];
          return Promise.map(lists, (list) => models.Notification.create({
              channel: 'email',
              UserId: user.id,
              GroupId: group.id,
              type: list
            })
          );
        })
      })
      .then(() => done())
      .catch(console.error);
  });

  it("forwards emails sent to info@:slug.opencollective.com", () => {

    const spy = sandbox.spy(emailLib, 'sendMessage');

    return request(app)
      .post('/webhooks/mailgun')
      .send(Object.assign({}, webhookBody, {recipient: 'info@testcollective.opencollective.com'}))
      .then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(spy.args[0][0]).to.equal('info@testcollective.opencollective.com');
        expect(spy.args[0][1]).to.equal(webhookBody.subject);
        expect(spy.args[0][3].bcc).to.equal(usersData[0].email);
      });
  });

  it("forwards the email for approval to the core members", () => {
    const spy = sandbox.spy(emailLib, 'send');

    return request(app)
      .post('/webhooks/mailgun')
      .send(webhookBody)
      .then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(spy.args[0][1]).to.equal('members@testcollective.opencollective.com');
        const emailSentTo = [spy.args[0][3].bcc,spy.args[1][3].bcc];
        expect(emailSentTo.indexOf(usersData[0].email) !== -1).to.be.true;
        expect(emailSentTo.indexOf(usersData[1].email) !== -1).to.be.true;
      });
  });

  it("rejects emails sent to unknown mailing list", () => {

    const unknownMailingListWebhook = Object.assign({}, webhookBody, { recipient: 'unknown@testcollective.opencollective.com' });

    return request(app)
      .post('/webhooks/mailgun')
      .send(unknownMailingListWebhook)
      .then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.error.message).to.equal('There is no user subscribed to unknown@testcollective.opencollective.com');
      });
  });

  it("approves the email", () => {

    const spy = sandbox.spy(emailLib, 'send');

    return request(app)
      .get(`/services/email/approve?messageId=eyJwIjpmYWxzZSwiayI6Ijc3NjFlZTBjLTc1NGQtNGIwZi05ZDlkLWU1NTgxODJkMTlkOSIsInMiOiI2NDhjZDg1ZTE1IiwiYyI6InNhb3JkIn0=&approver=${encodeURIComponent(usersData[1].email)}`)
      .then(() => {
        expect(spy.args[0][1]).to.equal('members@testcollective.opencollective.com');
        expect(spy.args[0][2].subject).to.equal('test collective members');
        expect(spy.args[0][3].bcc).to.equal(usersData[0].email);
        expect(spy.args[0][3].from).to.equal('testcollective collective <info@testcollective.opencollective.com>');
      });
  });

  it("return 404 if message not found", () => {
    const messageId = 'eyJwIjpmYWxzZSwiayI6IjY5MTdlYTZlLWVhNzctNGQzOC04OGUxLWMzMTQwMzdmNGRhNiIsInMiOiIwMjNjMzgwYWFlIiwiYyI6InNhaWFkIn0=';
    return request(app)
      .get(`/services/email/approve?messageId=${messageId}&approver=xdamman%40gmail.com&mailserver=so`)
      .then((res) => {
        expect(res.statusCode).to.equal(404);
        expect(res.body.error.message).to.contain(messageId);
      });
  });

  describe("unsubscribe", () => {

    const unsubscribeUrl = `/services/email/unsubscribe/${encodeURIComponent(usersData[0].email)}/${groupData.slug}/mailinglist.members/3d87fb0a6ffa99e8c4307f6fcd649dd1`;

    it("returns an error if invalid token", () => {
      return request(app)
        .get(`/services/email/unsubscribe/${encodeURIComponent(usersData[0].email)}/${groupData.slug}/mailinglist.members/xxxxxxxxxx`)
        .then((res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.message).to.equal('Invalid token');
        });
    });

    it("sends the unsubscribe link in the footer of the email", () => {

    const spy = sandbox.stub(emailLib, 'sendMessage');

    return request(app)
      .get(`/services/email/approve?messageId=eyJwIjpmYWxzZSwiayI6Ijc3NjFlZTBjLTc1NGQtNGIwZi05ZDlkLWU1NTgxODJkMTlkOSIsInMiOiI2NDhjZDg1ZTE1IiwiYyI6InNhb3JkIn0=&approver=${encodeURIComponent(usersData[1].email)}`)
      .then(() => {
        const emailBody = spy.args[0][2];
        expect(emailBody).to.contain(unsubscribeUrl);
        expect(emailBody).to.contain("To unsubscribe from members@testcollective.opencollective.com");
      });
    });

    it("unsubscribes", () => {
      const where = {
        UserId: users[0].id,
        GroupId: group.id,
        type: 'mailinglist.members'
      };

      return request(app)
        .get(unsubscribeUrl)
        .then(res => {
          console.log("res body", res.body);
          models.Notification.count({ where })
          .then(count => {
            expect(count).to.equal(0);
          });
      });
    });

    it("fails to unsubscribe if already unsubscribed", () => {

      const unsubscribeUrl = `/services/email/unsubscribe/${encodeURIComponent(usersData[0].email)}/${groupData.slug}/unknownType/38e32567c52039a97252b1e0537fd848`;

      return request(app)
        .get(unsubscribeUrl)
        .then(res => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.message).to.equal("No notification found for this user, group and type");
      });
    });

  });

});
