import app from '../server/index';
import config from 'config';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import request from 'supertest-as-promised';
import { expect } from 'chai';
import emailLib from '../server/lib/email';
import * as utils from '../test/utils';
import models from '../server/models';

const application = utils.data('application');
const userData = utils.data('user6');
const groupData = utils.data('group1');

const {
  User,
  Group
} = models;

describe('lib.notifications.test.js', () => {

  let user, group, nm;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user and group', () => {
    const promises = [User.create(userData), Group.create(groupData)];
    return Promise.all(promises).then(results => {
      user = results[0];
      group = results[1];
      return group.addUserWithRole(user, 'HOST')
    })
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
    let emailAttributes;
    const expense = utils.data('expense1');

    const templateData = {
      expense,
      user,
      group,
      config
    };

    templateData.expense.id = 1;

    emailLib.generateEmailFromTemplate('group.expense.created', user.email, templateData)
      .then(template => {
        emailAttributes = emailLib.getTemplateAttributes(template.html);
      })
      .then(() => request(app)
        .post(`/groups/${group.id}/expenses`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          api_key: application.api_key,
          expense
        })
        .expect(200))
      .then(res => {
        expect(res.body).to.have.property('GroupId', group.id);
        expect(res.body).to.have.property('UserId', user.id); // ...
      })
      .then(() => models.Expense.findAll())
      .then(expenses => {
        expect(expenses.length).to.equal(1);
      })
      .then(() => models.Activity.findAll())
      .then(activities => {
        expect(activities.length).to.equal(1);
      })
      .then(() => {
        setTimeout(() => {
          const options = nm.sendMail.lastCall.args[0];
          expect(options.to).to.equal(user.email);
          expect(options.subject).to.equal(`[TESTING] ${emailAttributes.subject}`);
          expect(options.html).to.contain(expense.title);
          expect(options.html).to.contain("APPROVE");
          expect(options.html).to.contain("REJECT");
          done();
        }, 1000);
      });
  });
});
