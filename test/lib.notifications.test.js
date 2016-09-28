import app from '../server/index';
import _ from 'lodash';
import config from 'config';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import request from 'supertest-as-promised';
import { expect } from 'chai';
import emailLib from '../server/lib/email';
import * as utils from '../test/utils';
import models from '../server/models';
import constants from '../server/constants/activities';

const userData = utils.data('user6');
const groupData = utils.data('group1');
const notificationData = {
  channel: 'email',
  type: constants.GROUP_TRANSACTION_CREATED,
  active: true };
const transactionsData = utils.data('transactions1').transactions;

const {
  User,
  Group,
  Notification
} = models;

describe('lib.notifications.test.js', () => {

  let user;
  let group;
  let nm;
  let application;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    const promises = [User.create(userData), Group.create(groupData)];
    return Promise.all(promises).then(results => {
      user = results[0];
      group = results[1];
      return group.addUserWithRole(user, 'HOST')
    })
    .then(() => {
      notificationData.UserId = user.id;
      notificationData.GroupId = group.id;
      return Notification.create(notificationData);
    });
  });

  // create a fake nodemailer transport
  beforeEach(done => {
    config.mailgun.user = 'xxxxx';
    config.mailgun.password = 'password';

    nm = nodemailer.createTransport({
          name: 'testsend',
          service: 'Mailgun',
          sendMail (data, callback) {
              callback();
          },
          logger: false
        });

    sinon.stub(nodemailer, 'createTransport', () => {
      return nm;
    });
    done();
  });

  // stub the transport
  beforeEach(done => {
    sinon.stub(nm, 'sendMail', (object, cb) => {
      cb(null, object);
    });
    done();
  });

  afterEach(done => {
    nm.sendMail.restore();
    done();
  })

  afterEach(() => {
    config.mailgun.user = '';
    config.mailgun.password = '';
    nodemailer.createTransport.restore();
  });

  it('sends a new `group.expense.created` email notification', done => {

    const templateData = {
      transaction: _.extend({}, transactionsData[0]),
      user,
      group,
      config
    };

    let subject, body;

    templateData.transaction.id = 1;

    if (templateData.transaction.link.match(/\.pdf$/))
      templateData.transaction.preview = {src: 'https://opencollective.com/static/images/mime-pdf.png', width: '100px'};
    else
      templateData.transaction.preview = {src: `https://res.cloudinary.com/opencollective/image/fetch/w_640/${templateData.transaction.link}`, width: '100%'};

    emailLib.generateEmailFromTemplate('group.expense.created', user.email, templateData)
      .then(template => {
        subject = emailLib.getSubject(template);
        body = emailLib.getBody(template);
      })
      .then(() => request(app)
        .post(`/groups/${group.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          transaction: transactionsData[0]
        })
        .expect(200))
      .then(res => {
        expect(res.body).to.have.property('GroupId', group.id);
        expect(res.body).to.have.property('UserId', user.id); // ...
      })
      .then(() => models.Transaction.findAll())
      .then(transactions => {
        expect(transactions.length).to.equal(1);
      })
      .then(() => models.Activity.findAll())
      .then(activities => {
        expect(activities.length).to.equal(1);
      })
      .then(() => {
        setTimeout(() => {
          const options = nm.sendMail.lastCall.args[0];
          expect(options.to).to.equal(user.email);
          expect(options.subject).to.equal(subject);
          expect(options.html).to.equal(body);
          done();
        }, 1000);

      });
  });
});
