import { expect } from 'chai';
import app from '../../../server/index';
import request from 'supertest';
import Promise from 'bluebird';
import sinon from 'sinon';
import models from '../../../server/models';
import emailLib from '../../../server/lib/email';
import { md5 } from '../../../server/lib/utils';

import webhookBodyPayload from '../../mocks/mailgun.webhook.payload';
import webhookBodyApprove from '../../mocks/mailgun.webhook.approve';
import * as utils from '../../utils';
import config from 'config';
import nock from 'nock';
import initNock from '../../nocks/email.routes.test.nock.js';
import { fakeCollective, fakeUser } from '../../test-helpers/fake-data';

const generateToken = (email, slug, template) => {
  const uid = `${email}.${slug}.${template}.${config.keys.opencollective.jwtSecret}`;
  return md5(uid);
};

const { Collective } = models;

const usersData = [
  {
    firstName: 'Xavier',
    lastName: 'Damman',
    email: 'xdamman+test@gmail.com',
    role: 'ADMIN',
    image: 'https://pbs.twimg.com/profile_images/3075727251/5c825534ad62223ae6a539f6a5076d3c.jpeg',
  },
  {
    firstName: 'Aseem',
    lastName: 'Sood',
    email: 'asood123+test@gmail.com',
    role: 'ADMIN',
  },
  {
    firstName: 'Pia',
    lastName: 'Mancini',
    email: 'pia+test@opencollective.com',
    role: 'BACKER',
  },
  {
    firstName: 'github',
    lastName: '',
    email: 'github+test@opencollective.com',
    image: 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Logo.png',
    role: 'BACKER',
  },
];

const collectiveData = {
  slug: 'testcollective',
  name: 'Test Collective',
  settings: {},
};

let collective,
  users = [];

describe('server/routes/email', () => {
  let sandbox;

  before(() => utils.resetTestDB());

  before(initNock);

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    nock.cleanAll();
  });

  before('create collective and members', done => {
    Collective.create(collectiveData)
      .tap(g => (collective = g))
      .then(() => Promise.map(usersData, u => models.User.createUserWithCollective(u)))
      .tap(users => {
        return Promise.map(users, (user, index) => {
          return collective.addUserWithRole(user, usersData[index].role);
        });
      })
      .tap(usersRows => {
        users = usersRows;
        return Promise.map(usersRows, (user, index) => {
          const lists = usersData[index].lists || [];
          return Promise.map(lists, list =>
            models.Notification.create({
              channel: 'email',
              UserId: user.id,
              CollectiveId: collective.id,
              type: list,
            }),
          );
        });
      })
      .then(() => done())
      .catch(console.error);
  });

  it('forwards emails sent to info@:slug.opencollective.com', async () => {
    const spy = sandbox.spy(emailLib, 'sendMessage');
    const collective = await fakeCollective();
    const users = await Promise.all([fakeUser(), fakeUser(), fakeUser()]);
    await Promise.all(users.map(user => collective.addUserWithRole(user, 'ADMIN')));

    return request(app)
      .post('/webhooks/mailgun')
      .send(
        Object.assign({}, webhookBodyPayload, {
          recipient: `info@${collective.slug}.opencollective.com`,
        }),
      )
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(spy.lastCall.args[0]).to.equal(`info@${collective.slug}.opencollective.com`);
        expect(spy.lastCall.args[1]).to.equal(webhookBodyPayload.subject);
        expect(users.map(u => u.email).indexOf(spy.lastCall.args[3].bcc) !== -1).to.be.true;
      });
  });

  it('do not forwards emails sent to info@:slug.opencollective.com if disabled', async () => {
    const spy = sandbox.spy(emailLib, 'sendMessage');
    const collective = await fakeCollective({ settings: { features: { forwardEmails: false } } });
    const user = await fakeUser();
    await collective.addUserWithRole(user, 'ADMIN');
    const endpoint = request(app).post('/webhooks/mailgun');
    const res = await endpoint.send(
      Object.assign({}, webhookBodyPayload, {
        recipient: `info@${collective.slug}.opencollective.com`,
      }),
    );

    expect(res.body.error).to.exist;
    expect(spy.lastCall).to.not.exist;
  });

  it('forwards the email for approval to the core members', () => {
    const spy = sandbox.spy(emailLib, 'send');
    return request(app)
      .post('/webhooks/mailgun')
      .send(webhookBodyPayload)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        const emailSentTo = [];
        for (let i = 0; i < spy.args.length; i++) {
          if (spy.args[i][0] === 'email.approve') {
            // We expect that the email.to is admins@testcollective.opencollective.com
            expect(spy.args[i][1]).to.equal('admins@testcollective.opencollective.com');
            // We check that latest subscribers are present with their avatar (or default avatar)
            const latestSubscribers = spy.args[i][2].latestSubscribers.sort((a, b) =>
              a.name === b.name ? 0 : a.name < b.name ? 1 : -1,
            );
            expect(latestSubscribers[0].roundedAvatar).to.equal(
              'https://res.cloudinary.com/opencollective/image/fetch/c_thumb,g_face,h_48,r_max,w_48,bo_3px_solid_white/c_thumb,h_48,r_max,w_48,bo_2px_solid_rgb:66C71A/e_trim/f_auto/https%3A%2F%2Fassets-cdn.github.com%2Fimages%2Fmodules%2Flogos_page%2FGitHub-Logo.png',
            );
            expect(latestSubscribers[1].roundedAvatar).to.equal(
              'https://ui-avatars.com/api/?name=Pia%20Mancini&rounded=true&size=48',
            );
            emailSentTo.push(spy.args[i][3].bcc);
          }
        }
        expect(emailSentTo.indexOf(usersData[0].email) !== -1).to.be.true;
        expect(emailSentTo.indexOf(usersData[1].email) !== -1).to.be.true;
      });
  });

  it('skip the email if already processed', () => {
    const spy = sandbox.spy(emailLib, 'send');

    return request(app)
      .post('/webhooks/mailgun')
      .send(webhookBodyApprove)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(spy.called).to.be.false;
      });
  });

  it('rejects emails sent to unknown mailing list', () => {
    const unknownMailingListWebhook = Object.assign({}, webhookBodyPayload, {
      recipient: 'unknown@testcollective.opencollective.com',
    });

    return request(app)
      .post('/webhooks/mailgun')
      .send(unknownMailingListWebhook)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.error.message).to.equal(
          'Invalid mailing list address unknown@testcollective.opencollective.com',
        );
      });
  });

  it('approves the email', () => {
    const spy = sandbox.spy(emailLib, 'send');

    return request(app)
      .get(
        `/services/email/approve?messageId=eyJwIjpmYWxzZSwiayI6Ijc3NjFlZTBjLTc1NGQtNGIwZi05ZDlkLWU1NTgxODJkMTlkOSIsInMiOiI2NDhjZDg1ZTE1IiwiYyI6InNhb3JkIn0=&approver=${encodeURIComponent(
          usersData[1].email,
        )}`,
      )
      .then(() => {
        const emailsSent = spy.args.filter(c => c[0] === 'email.message');
        const emailData = emailsSent[0][2];
        expect(emailData.sender.email).to.equal(usersData[0].email);
        expect(emailData.sender.image).to.equal(usersData[0].image);
        expect(emailData.approver.email).to.equal(usersData[1].email);
        expect(emailData.approver.image).to.equal(usersData[1].image);
        expect(emailsSent.length).to.equal(2);
        expect(emailsSent[0][1]).to.equal('admins@testcollective.opencollective.com');
        expect(emailsSent[0][2].subject).to.equal('test collective admins');
        expect([emailsSent[0][3].bcc, emailsSent[1][3].bcc]).to.contain(usersData[0].email);
        expect(emailsSent[0][3].from).to.equal('testcollective collective <hello@testcollective.opencollective.com>');
      });
  });

  it('return 404 if message not found', () => {
    const messageId =
      'eyJwIjpmYWxzZSwiayI6IjY5MTdlYTZlLWVhNzctNGQzOC04OGUxLWMzMTQwMzdmNGRhNiIsInMiOiIwMjNjMzgwYWFlIiwiYyI6InNhaWFkIn0=';
    return request(app)
      .get(`/services/email/approve?messageId=${messageId}&approver=xdamman%40gmail.com&mailserver=so`)
      .then(res => {
        expect(res.statusCode).to.equal(404);
        expect(res.body.error.message).to.contain(messageId);
      });
  });

  describe('send email to event', () => {
    let spy;
    const slug = 'event1-ev111';
    const subject = 'email reminder for event 1';

    before(async () => {
      const event = await models.Collective.create({
        type: 'EVENT',
        name: 'event 1',
        ParentCollectiveId: collective.id,
        slug,
      });

      await models.Member.create({
        CreatedByUserId: users[0].id,
        MemberCollectiveId: users[0].CollectiveId,
        CollectiveId: event.id,
        role: 'FOLLOWER',
      });

      await models.Member.create({
        CreatedByUserId: users[1].id,
        MemberCollectiveId: users[1].CollectiveId,
        CollectiveId: event.id,
        role: 'ATTENDEE',
      });
    });

    it('send please approve email when sending email to eventSlug@parentCollectiveSlug.opencollective.com', async () => {
      spy = sandbox.spy(emailLib, 'sendMessage');
      return request(app)
        .post('/webhooks/mailgun')
        .send(
          Object.assign({}, webhookBodyPayload, {
            recipient: `${slug}@${collective.slug}.opencollective.com`,
            subject,
          }),
        )
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(spy.args[0][0]).to.equal(`admins@${collective.slug}.opencollective.com`);
          expect(spy.args[0][1]).to.equal(`Please approve: ${subject}`);
          expect(usersData.map(u => u.email).indexOf(spy.args[0][3].bcc) !== -1).to.be.true;
        });
    });

    it('approves an email sent to eventSlug@parentCollectiveSlug.opencollective.com', () => {
      spy = sandbox.spy(emailLib, 'send');
      return request(app)
        .get(
          `/services/email/approve?messageId=abJwIjpmYWxzZSwiayI6Ijc3NjFlZTBjLTc1NGQtNGIwZi05ZDlkLWU1NTgxODJkMTlkOSIsInMiOiI2NDhjZDg1ZTE1IiwiYyI6InNhb3JkIn0=&approver=${encodeURIComponent(
            usersData[1].email,
          )}`,
        )
        .then(() => {
          expect([users[0].email, users[1].email].indexOf(spy.args[0][3].bcc) !== -1).to.be.true;
          expect([users[0].email, users[1].email].indexOf(spy.args[1][3].bcc) !== -1).to.be.true;
        });
    });
  });

  describe('unsubscribe', () => {
    const template = 'mailinglist.admins';

    const generateUnsubscribeUrl = email => {
      const token = generateToken(email, collectiveData.slug, template);
      return `/services/email/unsubscribe/${encodeURIComponent(email)}/${collectiveData.slug}/${template}/${token}`;
    };

    it('returns an error if invalid token', () => {
      return request(app)
        .get(
          `/services/email/unsubscribe/${encodeURIComponent(usersData[0].email)}/${
            collectiveData.slug
          }/${template}/xxxxxxxxxx`,
        )
        .then(res => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error.message).to.equal('Invalid token');
        });
    });

    it('sends the unsubscribe link in the footer of the email', () => {
      const spy = sandbox.stub(emailLib, 'sendMessage');

      return request(app)
        .get(
          `/services/email/approve?messageId=eyJwIjpmYWxzZSwiayI6Ijc3NjFlZTBjLTc1NGQtNGIwZi05ZDlkLWU1NTgxODJkMTlkOSIsInMiOiI2NDhjZDg1ZTE1IiwiYyI6InNhb3JkIn0=&approver=${encodeURIComponent(
            usersData[1].email,
          )}`,
        )
        .then(() => {
          for (const i in spy.args) {
            const emailBody = spy.args[i][2];
            expect(emailBody).to.contain(generateUnsubscribeUrl(spy.args[i][3].bcc));
            expect(emailBody).to.contain('To unsubscribe from the admins mailing list');
          }
        });
    });

    it('unsubscribes', () => {
      const where = {
        UserId: users[0].id,
        CollectiveId: collective.id,
        type: 'mailinglist.admins',
        active: true,
      };

      return request(app)
        .get(generateUnsubscribeUrl(users[0].email))
        .then(() => models.Notification.count({ where }))
        .then(count => expect(count).to.equal(0));
    });
  });
});
