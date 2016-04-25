const app = require('../index');
const emailLib = require('../server/lib/email')(app);
const expect = require('chai').expect;
const utils = require('../test/utils.js')();
const emailData = utils.data('emailData');
const config = require('config');

describe('lib/email', () => {
  
  it('sends the thankyou.fr email template', function(done) {
    this.timeout(2000);

    const paymentData = {
      amountFloat: 50.00,
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

    const previousSendMail = app.mailgun.sendMail;
    app.mailgun.sendMail = (options) => {
      expect(options.to).to.equal(data.user.email);
      expect(options.subject).to.contain('Merci pour votre donation de €50/mois à La Primaire');
      done();
      app.mailgun.sendMail = previousSendMail;
      return options;
    }
    emailLib.send('thankyou', data.user.email, data);
  });

  it('sends the thankyou.wwcode email template', function(done) {
    this.timeout(2000);

    const paymentData = {
      amountFloat: 50.00,
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

    const previousSendMail = app.mailgun.sendMail;
    app.mailgun.sendMail = (options) => {
      expect(options.to).to.equal(data.user.email);
      expect(options.subject).to.contain('Thank you for your $50/month donation to WWCode Austin');
      expect(options.html).to.contain('4218859');
      done();
      app.mailgun.sendMail = previousSendMail;
      return options;
    }
    emailLib.send('thankyou', data.user.email, data);
  });
});
