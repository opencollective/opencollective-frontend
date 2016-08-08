const app = require('../index');
const emailLib = require('../server/lib/email')(app);
const expect = require('chai').expect;
const utils = require('../test/utils.js')();
const emailData = utils.data('emailData');
const config = require('config');

describe('lib/email', () => {

  it('sends the thankyou.fr email template', function() {
    this.timeout(2000);

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
        const options = app.mailgun.sendMail.lastCall.args[0];
        expect(options.to).to.equal(data.user.email);
        expect(options.subject).to.contain('Merci pour votre donation de €50/mois à La Primaire');
      });
  });

  it('sends the thankyou.wwcode email template', function() {
    this.timeout(2000);

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
        const options = app.mailgun.sendMail.lastCall.args[0];
        expect(options.to).to.equal(data.user.email);
        expect(options.subject).to.contain('Thank you for your $50/month donation to WWCode Austin');
        expect(options.html).to.contain('4218859');
      });
  });
});
