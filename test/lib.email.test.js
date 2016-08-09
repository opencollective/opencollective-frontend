const sinon = require('sinon');
const nodemailer = require('nodemailer');
const expect = require('chai').expect;

const emailLib = require('../server/lib/email');
const utils = require('../test/utils.js')();
const emailData = utils.data('emailData');
const config = require('config');

describe('lib/email', () => {

  var nm;

  // create a fake nodemailer transport
  beforeEach(done => {
    config.mailgun.user = 'xxxxx';
    config.mailgun.password = 'password';

    nm = nodemailer.createTransport({
          name: 'testsend',
          service: 'Mailgun',
          sendMail: function (data, callback) {
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


  it('sends the thankyou.fr email template', done => {
    const paymentData = {
      amount: 5000,
      currency: 'EUR'
     };

    const data = {
      donation: paymentData,
      interval: 'month',
      user: emailData.user,
      group: {
        name: "La Primaire",
        slug: "laprimaire"
      },
      config: config
    };

    return emailLib.send('thankyou', data.user.email, data)
      .then(() => {
        expect(nm.sendMail.lastCall.args[0].to).to.equal(data.user.email);
        expect(nm.sendMail.lastCall.args[0].subject).to.contain('Merci pour votre donation de €50/mois à La Primaire');
        done();
      });
  });

  it('sends the thankyou.wwcode email template', done => {

    const paymentData = {
      amount: 5000,
      currency: 'USD'
     };

    const data = {
      donation: paymentData,
      interval: 'month',
      user: emailData.user,
      group: {
        name: "WWCode Austin",
        slug: "wwcodeaustin"
      },
      config: config
    };

    return emailLib.send('thankyou', data.user.email, data)
      .then(() => {
        expect(nm.sendMail.lastCall.args[0].to).to.equal(data.user.email);
        expect(nm.sendMail.lastCall.args[0].subject).to.contain('Thank you for your $50/month donation to WWCode Austin');
        expect(nm.sendMail.lastCall.args[0].html).to.contain('4218859');
        done();
      });
  });

});
